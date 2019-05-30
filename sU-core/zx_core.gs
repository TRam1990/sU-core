include "Library.gs"
include "Signal.gs"
include "Trigger.gs"
include "zx_specs.gs"
include "xtrainz03su.gs"
include "xtrainz03sl.gs"
include "xtrainzs.gs"
include "xtrainz03intu.gs"
include "multiplayersessionmanager.gs"


include "zx_specs.gs"
include "zx_mrk.gs"
include "zx_router.gs"
include "zx_signal.gs"
include "zx_speedboard.gs"

class zxLibruary_core isclass Library
{

public BinarySortedArraySl Signals;										//массив сигналов
public BinarySortedArraySl SpeedObjects;									//массив ограничителей скорости
public BinarySortedArrayIntu train_arr;										//массив поездов


public BinarySortedStrings Stations;										//массив станций
public BinarySortedStrings ProtectGroups;									//массив групп заградительных

MultiplayerSessionManager mp_lib;

public float str_distance = 40.0;

string err;
string last_edited_station = "";

bool IsInited=false;
bool All_added=false;
bool All_speed_added=false;

zxSignal[] blink_sig;

public bool MP_started = false;
public bool MP_NotServer = false;											// не является сервером в мультиплеерной игре (отключение логики)

zxSignal_Cache[] sig_cache;

bool objectRunningDriver = false;
Soup temp_speed_sp;
string[] tabl_str;

zxExtraLinkBase[] zxExtra;




int SearchForTrain(zxSignal sig1, int train_id, int multiplicator);
void SendMessagesToClients(Soup data, string type);
void SendMessageToServer(Soup data, string type);

void UpdateSignState(zxSignal zxSign, int reason, int priority)
	{
	zxSign.UpdateState(reason,priority);

	if(zxExtra.size() > 0)
		{
		int i;
		for(i=0;i<zxExtra.size();i++)
			zxExtra[i].UpdateSignalState(zxSign, reason, priority);
		}

	}

public void AddExtraLink(zxExtraLinkBase new_link)
	{
	int old_size = zxExtra.size();
	zxExtra[old_size,old_size] = new zxExtraLinkBase[1];
	zxExtra[old_size] = new_link;
	}

public bool RemoveExtraLink(zxExtraLinkBase new_link)
	{
	int i = 0;
	while(i < zxExtra.size())
		{
		if(zxExtra[i] == new_link)
			{
			zxExtra[i,i+1] = null;
			return true;
			}
		i++;
		}
	return false;
	}


void SignalControlHandler(Message msg)//приём заданий на открытость-закрытость светофора
	{
	zxSignal curr_sign=cast<zxSignal>(msg.dst);

	if(!curr_sign)
		return;

	bool update_signal = false;



	if(curr_sign.Type & zxSignal.ST_PROTECT)
		{
		if(msg.minor=="MayOpen^true")
			{
			if(curr_sign.ProtectGroup == "")
				{
				curr_sign.barrier_closed = false;
				update_signal = true;
				}
			else
				{
				int N = curr_sign.protect_soup.GetNamedTagAsInt("number",0);
				int i;
				for(i=0;i<N;i++)
					{
					zxSignal TMP = cast<zxSignal>(Router.GetGameObject(curr_sign.protect_soup.GetNamedTag(i+"")));

					if(TMP)
						{
						TMP.barrier_closed = false;
						UpdateSignState(TMP,0,-1);
						}
					}
				}
			}
		else if(msg.minor=="MayOpen^false")
			{
			if(curr_sign.ProtectGroup == "")
				{
				curr_sign.barrier_closed = true;
				update_signal = true;
				}
			else
				{
				int N = curr_sign.protect_soup.GetNamedTagAsInt("number",0);
				int i;
				for(i=0;i<N;i++)
					{
					zxSignal TMP = cast<zxSignal>(Router.GetGameObject(curr_sign.protect_soup.GetNamedTag(i+"")));

					if(TMP)
						{
						TMP.barrier_closed = true;
						UpdateSignState(TMP,0,-1);
						}
					}
				}
			}
		}
	else
		{
		if(msg.minor=="MayOpen^true" and !curr_sign.shunt_open and !(curr_sign.Type & zxSignal.ST_SHUNT))
			{
			curr_sign.train_open = true;	
			update_signal = true;
			}
		else if(msg.minor=="MayOpen^false" and !(curr_sign.Type & zxSignal.ST_PERMOPENED))
			{
			curr_sign.train_open = false;
			update_signal = true;
			}
		}

	if(msg.minor=="ShuntMode.true" and !curr_sign.train_open)
		{
		curr_sign.shunt_open = true;
		update_signal = true;
		}
	else if(msg.minor=="ShuntMode.false" or msg.minor=="Close")
		{
		curr_sign.shunt_open = false;
		update_signal = true;
		}

	else if(msg.minor=="PriglMode.true")
		{
		curr_sign.prigl_open = true;
		update_signal = true;
		}
	else if(msg.minor=="PriglMode.false")
		{
		curr_sign.prigl_open = false;
		update_signal = true;
		}
	else if(msg.minor[0,4]=="ALS-")
		{
		curr_sign.code_freq= Str.ToInt(msg.minor[4,]);
		}


	if(update_signal)
		UpdateSignState(curr_sign,0,-1);

	}


void LogTrainIdS(int number)
	{
	string log1="";

	zxSignal sig_linked = (cast<zxSignalLink>(Signals.DBSE[number].Object)).sign;

	int n = sig_linked.TC_id.size();
	int i;

	for(i=0;i<n;i++)
		log1=log1+" "+sig_linked.TC_id[i];

	Interface.Log("signal! "+sig_linked.GetName()+log1);
	}



void LowerMaxLimits(TrainContainer train_con, int prior)	// поиск минимального положительного лимита
	{							// и присвоение его ко всем объектам с ненулевым лимитом
	if(prior==1)
		{
		bool any_speed = false;
		float max_speed;
		int i;

		for(i=0;i<train_con.signal.size();i++)
			{
			if(train_con.state[i]>=2 and train_con.state[i]<=3)
				{
				zxSignal sig = (cast<zxSignalLink>(Signals.DBSE[(train_con.signal[i])].Object)).sign;
				
				if(!(sig.Type & zxSignal.ST_UNLINKED) and (sig.MainState != zxIndication.STATE_B) and (sig.MainState != 0))
					{

					if(sig.max_speed_pass > 0)
						{
						if(!any_speed)
							{
							max_speed=sig.max_speed_pass;
							any_speed=true;
							}
						else if(max_speed>sig.max_speed_pass)
							max_speed=sig.max_speed_pass;
						}
					else if(sig.speed_limit > 0)
						{
						if(!any_speed)
							{
							max_speed=sig.speed_limit;
							any_speed=true;
							}
						else if(max_speed>sig.speed_limit)
							max_speed=sig.speed_limit;
						}
					}
				}
			}
		for(i=0;i<train_con.speed_object.size();i++)
			{
			zxSpeedObject speed_obj = cast<zxSpeedObject>(SpeedObjects.DBSE[(train_con.speed_object[i])].Object);
			if(speed_obj.max_speed_pass > 0)
				{
				if(!any_speed)
					{
					max_speed=speed_obj.max_speed_pass;
					any_speed=true;
					}
				else if(max_speed>speed_obj.max_speed_pass)
					max_speed=speed_obj.max_speed_pass;
				}
			}

		if(any_speed)
			{
			for(i=0;i<train_con.signal.size();i++)
				{
				if(train_con.state[i]>=2 and train_con.state[i]<=3)
					{
					zxSignal sig = (cast<zxSignalLink>(Signals.DBSE[(train_con.signal[i])].Object)).sign;
					sig.SetSpeedLimit(max_speed);
					}
				}
			for(i=0;i<train_con.speed_object.size();i++)
				{
				zxSpeedObject speed_obj = cast<zxSpeedObject>(SpeedObjects.DBSE[(train_con.speed_object[i])].Object);
				speed_obj.SetSpeedLimit(max_speed);
				}
			}
		}
	else
		{
		bool any_speed = false;
		float max_speed;
		int i;

		for(i=0;i<train_con.signal.size();i++)
			{
			if(train_con.state[i]>=2 and train_con.state[i]<=3)
				{
				zxSignal sig = (cast<zxSignalLink>(Signals.DBSE[(train_con.signal[i])].Object)).sign;

				if(!(sig.Type & zxSignal.ST_UNLINKED) and (sig.MainState != zxIndication.STATE_B) and (sig.MainState != 0))
					{

					if(sig.max_speed_cargo > 0)
						{
						if(!any_speed)
							{
							max_speed=sig.max_speed_cargo;
							any_speed=true;
							}
						else if(max_speed>sig.max_speed_cargo)
							max_speed=sig.max_speed_cargo;
						}
					else if(sig.speed_limit > 0)
						{
						if(!any_speed)
							{
							max_speed=sig.speed_limit;
							any_speed=true;
							}
						else if(max_speed>sig.speed_limit)
							max_speed=sig.speed_limit;
						}
					}
				}
			}
		for(i=0;i<train_con.speed_object.size();i++)
			{
			zxSpeedObject speed_obj = cast<zxSpeedObject>(SpeedObjects.DBSE[(train_con.speed_object[i])].Object);
			if(speed_obj.max_speed_cargo > 0)
				{
				if(!any_speed)
					{
					max_speed=speed_obj.max_speed_cargo;
					any_speed=true;
					}
				else if(max_speed>speed_obj.max_speed_cargo)
					max_speed=speed_obj.max_speed_cargo;
				}
			}

		if(any_speed)
			{
			for(i=0;i<train_con.signal.size();i++)
				{
				if(train_con.state[i]>=2 and train_con.state[i]<=3)
					{
					zxSignal sig = (cast<zxSignalLink>(Signals.DBSE[(train_con.signal[i])].Object)).sign;
					
					sig.SetSpeedLimit(max_speed);
					}
				}
			for(i=0;i<train_con.speed_object.size();i++)
				{
				zxSpeedObject speed_obj = cast<zxSpeedObject>(SpeedObjects.DBSE[(train_con.speed_object[i])].Object);
				
				speed_obj.SetSpeedLimit(max_speed);
				}
			}
		}
	}





void TrainCatcher(zxSignal entered_sign, Train curr_train)
	{
	int number=entered_sign.OwnId;
	if(number<0)							// база светофоров ещё непроиндексирована, но уже построена
		number=Signals.Find(entered_sign.GetName());


	if(entered_sign.GetName() != Signals.DBSE[number].a)
		Interface.Exception("signal map name changed from "+Signals.DBSE[number].a+" to "+entered_sign.GetName());


	if(!curr_train )  // поезд потерян
		{
		Interface.Exception("A train contains a bad vehicle!");
		return;
		}

	int priority = 2;
	if(curr_train.GetTrainPriorityNumber() == 1)
		priority = 1;


	int train_id = curr_train.GetId();


	int state1 = SearchForTrain(entered_sign, train_id, 1 );
	bool high_speed = false;

	if(state1 == 0)
		{
		state1 = SearchForTrain(entered_sign, train_id, 2 );
		high_speed = true;		
		if(state1 == 0)		// поезд найти не удалось
			return;
		}

	int train_nmb=train_arr.Find(train_id);

	if(train_nmb<0)
		{
		TrainContainer train_con = new TrainContainer();

		train_nmb= train_arr.AddElement(train_id,cast<GSObject>train_con);
		if(train_nmb<0)
			{
			Interface.Exception("Can't add train "+train_id);
			return;
			}

		Vehicle[] veh_arr=curr_train.GetVehicles();

		bool stopped=false;
		if(veh_arr.size()>0 and veh_arr[0] and veh_arr[0].GetVelocity()==0.0f)
			stopped=true;

		train_con = cast<TrainContainer>(train_arr.DBSE[train_nmb].Object);

		train_con.IsStopped=stopped;

		train_con.HighSpeed=high_speed;

		train_con.signal=new int[1];
		train_con.signal[0]=number;
		train_con.state=new int[1];
		train_con.state[0]=state1;
		train_con.speed_object=new int[0];


		(cast<zxSignalLink>(Signals.DBSE[number].Object)).sign.AddTrainId(curr_train.GetId());

		Sniff(curr_train, "Train", "StartedMoving", true);
		Sniff(curr_train, "Train", "StoppedMoving", true);
		Sniff(curr_train, "Train", "Cleanup", true);


		LowerMaxLimits(train_con, priority);

		}
	else				// такой поезд уже наехал на светофор
		{
		int i=0;
		bool exist=false;
		TrainContainer train_con = cast<TrainContainer>(train_arr.DBSE[train_nmb].Object);
		int size1 = train_con.signal.size();

		while(i<size1 and !exist)
			{
			if(train_con.signal[i] == number)
				exist=true;
			i++;
			}

		if(!exist)		// но не на этот
			{
			train_con.signal[size1,size1]=new int[1];
			train_con.state[size1,size1]=new int[1];

			train_con.signal[size1]=number;
			train_con.state[size1]=state1;

			train_con.HighSpeed=high_speed;

			(cast<zxSignalLink>(Signals.DBSE[number].Object)).sign.AddTrainId(curr_train.GetId());

			LowerMaxLimits(train_con, priority);
			}
		else
			{

			}
		}
	}






void TrainSpeedTriggerCatcher(Message msg);

void TrainCatcher(Message msg) // ожидание наезда поезда на сигнал, ловля Object,Enter
	{
	if(MP_NotServer)
		return;

	zxSignal entered_sign=cast<zxSignal>(msg.dst);
	if(!entered_sign)
		{
		TrainSpeedTriggerCatcher(msg);
		return;
		}

	TrainCatcher(entered_sign, cast<Train>(msg.src));
	}



void RemoveTrain(Message msg)
	{
	Train curr_train=msg.src;

	if(!curr_train)  // поезд потерян
		{
		Interface.Exception("A train contains a bad vehicle!");
		return;
		}
	int train_id = curr_train.GetId();
	int train_nmb=train_arr.Find(train_id);

	if(train_nmb>=0)	// поезд, стоящий на светофоре, ещё не удалён
		{
		int i = 0;

		TrainContainer train_con = cast<TrainContainer>(train_arr.DBSE[train_nmb].Object);

		for(i=0;i<train_con.signal.size();i++)
			{
			int number = train_con.signal[i];
			(cast<zxSignalLink>(Signals.DBSE[number].Object)).sign.RemoveTrainId(train_id);
			UpdateSignState( (cast<zxSignalLink>(Signals.DBSE[number].Object)).sign,5,-1);
			}

		train_con.signal[0, ] = null;
		train_con.state[0, ] = null;
		train_con.speed_object[0, ] = null;

		train_arr.DeleteElementByNmb(train_nmb);


		Sniff(curr_train, "Train", "StartedMoving", false);
		Sniff(curr_train, "Train", "StoppedMoving", false);
		Sniff(curr_train, "Train", "Cleanup", false);

		}
	}



void TrainCleaner(zxSignal entered_sign, Train curr_train, int train_nmb, int sign_numb, bool recheck) // ожидание съезда поезда с сигнала, ловля Object,Leave
	{
	if(!curr_train or (train_nmb < 0))  // поезд потерян
		{
		Interface.Print("A train "+ train_nmb + " was deletted or contains a bad vehicle!");

		int n = entered_sign.TC_id.size();
		int i=0;

		bool any_removed = false;

		while(i<n)						// сборщик мусора
			{
			Train tr1 = cast<Train>(Router.GetGameObject( entered_sign.TC_id[i] ));

			if(!tr1)
				{
				int train_id1 = entered_sign.TC_id[i];
				int train_nmb=train_arr.Find( train_id1);

				UpdateSignState(entered_sign,5,-1);

				entered_sign.RemoveTrainId(train_id1);
				
				train_arr.DeleteElementByNmb(train_nmb);

				any_removed = true;
				}
			else
				i++;
			}

		if(!any_removed and (train_nmb >= 0) and (sign_numb >= 0))
			{
			TrainContainer train_con = cast<TrainContainer>(train_arr.DBSE[train_nmb].Object);

			train_con.signal[sign_numb,sign_numb+1]=null;
			train_con.state[sign_numb,sign_numb+1]=null;

			UpdateSignState( entered_sign,5,-1);


			if(train_con.signal.size()==0 and train_con.speed_object.size()==0)
				train_arr.DeleteElementByNmb(train_nmb);
			}


		return;
		}


	int train_id = train_arr.DBSE[train_nmb].a;
	TrainContainer train_con = cast<TrainContainer>(train_arr.DBSE[train_nmb].Object);

	if(sign_numb < 0)
		{
		int number=entered_sign.OwnId;
		if(number<0)							// база светофоров ещё непроиндексирована
			number=Signals.Find(entered_sign.GetName());

		int i = 0;
		int size1 = train_con.signal.size();
		while(sign_numb<0 and i<size1)
			{
			if(train_con.signal[i] == number)
				sign_numb = i;
			i++;
			}
		}

	if(sign_numb>=0)		// поезд действительно наехал на этот светофор
		{
					// проверка того, что поезд только с одной стороны от светофора

		int train_position = 0;

		if(recheck)
			{
			int q = 1;
			if(train_con.HighSpeed)
				q = 2;

			train_position = SearchForTrain(entered_sign, train_id, q );
			}

		if(!recheck or (train_position == 0 and train_con.state[sign_numb] == 0 ) )
			{
			train_con.signal[sign_numb,sign_numb+1]=null;
			train_con.state[sign_numb,sign_numb+1]=null;


			entered_sign.RemoveTrainId(train_id);

			UpdateSignState( entered_sign,5,-1);

			if(train_con.signal.size()==0 and train_con.speed_object.size()==0)
				{
				train_arr.DeleteElementByNmb(train_nmb);

				Sniff(curr_train, "Train", "StartedMoving", false);
				Sniff(curr_train, "Train", "StoppedMoving", false);
				Sniff(curr_train, "Train", "Cleanup", false);
				}
			else
				{
				int priority = 2;
				if(curr_train.GetTrainPriorityNumber() == 1)
					priority = 1;
				LowerMaxLimits(train_con, priority);
				}
			}
		}
	}


void TrainSpeedTriggerCleaner(Message msg);

void TrainCleaner(Message msg) // ожидание съезда поезда с сигнала, ловля Object,Leave
	{
	if(MP_NotServer)
		return;

	zxSignal entered_sign=cast<zxSignal>(msg.dst);
	if(!entered_sign)
		{
		TrainSpeedTriggerCleaner(msg);
		return;
		}

	int train_nmb = -1;

	Train train_obj = cast<Train>(msg.src);
	if(train_obj)
		{
		int train_id = train_obj.GetId();
		train_nmb = train_arr.Find(train_id);
		}

	TrainCleaner( entered_sign, train_obj, train_nmb, -1, true );
	}



void TrainSpeedTriggerCatcher(Message msg)
	{
	zxSpeedObject entered_object=cast<zxSpeedObject>(msg.dst);
	if(!entered_object)
		return;

	Train curr_train = cast<Train>(msg.src);
	if(!curr_train)  // поезд потерян
		{
		Interface.Print("A train was deletted or contains a bad vehicle!");
		return;
		}

// поиск поезда в противоположном от маркера направлении (противонаправленные не влияют на ограничение)



	GSTrackSearch GSTS = entered_object.BeginTrackSearch(false);

	MapObject MO = GSTS.SearchNext();

	while(MO and GSTS.GetDistance()<str_distance and !(MO.isclass(Vehicle) and (cast<Vehicle>MO).GetMyTrain() ==  curr_train  ))
		{
		MO = GSTS.SearchNext();
		}


	if(!MO or !(MO.isclass(Vehicle) and (cast<Vehicle>MO).GetMyTrain() ==  curr_train  ))	// состав не найден
		return;



	int number=entered_object.OwnId;
	if(number<0)							// база светофоров ещё непроиндексирована
		number=SpeedObjects.Find(entered_object.GetName());


	int priority = 2;
	if(curr_train.GetTrainPriorityNumber() == 1)
		priority = 1;


	int train_id = curr_train.GetId();
	int train_nmb = train_arr.Find(train_id);

	if(train_nmb<0)	// не добавлялся
		{

		TrainContainer train_con = new TrainContainer();

		train_nmb= train_arr.AddElement(train_id,cast<GSObject>train_con);
		if(train_nmb<0)
			{
			Interface.Exception("Can't add train "+train_id);
			return;
			}

		Vehicle[] veh_arr=curr_train.GetVehicles();

		bool stopped=false;
		if(veh_arr.size()>0 and veh_arr[0] and veh_arr[0].GetVelocity()==0.0f)
			stopped=true;

		train_con = cast<TrainContainer>(train_arr.DBSE[train_nmb].Object);

		train_con.IsStopped=stopped;

		train_con.HighSpeed=false;

		train_con.speed_object=new int[1];
		train_con.speed_object[0] = number;
		train_con.signal=new int[0];
		train_con.state=new int[0];


		Sniff(curr_train, "Train", "StartedMoving", true);
		Sniff(curr_train, "Train", "StoppedMoving", true);
		Sniff(curr_train, "Train", "Cleanup", true);


		LowerMaxLimits(train_con, priority);

		}
	else
		{
		int i=0;
		bool exist=false;
		TrainContainer train_con = cast<TrainContainer>(train_arr.DBSE[train_nmb].Object);
		int size1 = train_con.speed_object.size();

		while(i<size1 and !exist)
			{
			if(train_con.speed_object[i] == number)
				exist=true;
			i++;
			}

		if(!exist)		// но не на этот
			{
			train_con.speed_object[size1,size1]=new int[1];
			train_con.speed_object[size1] = number;

			// перевыставление скоростей

			LowerMaxLimits(train_con, priority);



			}
		else
			{

			}
		}
	}


void TrainSpeedTriggerCleaner(Message msg)
	{
	zxSpeedObject entered_object=cast<zxSpeedObject>(msg.dst);
	if(!entered_object)
		return;

	Train curr_train = cast<Train>(msg.src);
	if(!curr_train)  // поезд потерян
		{
		Interface.Print("A train was deletted or contains a bad vehicle!");
		return;
		}

	int number=entered_object.OwnId;
	if(number<0)							// база светофоров ещё непроиндексирована
		number=SpeedObjects.Find(entered_object.GetName());


	int train_id = curr_train.GetId();
	int train_nmb = train_arr.Find(train_id);

	if(train_nmb>=0)
		{
		TrainContainer train_con = cast<TrainContainer>(train_arr.DBSE[train_nmb].Object);

		int i = 0;
		int num1 = -1;
		int size1 = train_con.speed_object.size();
		while(num1<0 and i<size1)
			{
			if(train_con.speed_object[i] == number)
				num1 = i;
			i++;
			}

		if(num1>=0)		// поезд действительно наехал на это ограничение скорости
			{

			train_con.speed_object[num1,num1+1]=null;

			if(train_con.signal.size()==0 and train_con.speed_object.size()==0)
				{
				train_arr.DeleteElementByNmb(train_nmb);

				Sniff(curr_train, "Train", "StartedMoving", false);
				Sniff(curr_train, "Train", "StoppedMoving", false);
				Sniff(curr_train, "Train", "Cleanup", false);
				}
			else		// перевыставление скоростей
				{
				int priority = 2;
				if(curr_train.GetTrainPriorityNumber() == 1)
					priority = 1;

				LowerMaxLimits(train_con, priority);
				}
			}
		// в остальных случаях ничего не удаляется
		}
	else
		{

		}
	}



thread void BlinkProcessing()
	{

	while(true)
		{
		int i = 0;
		while(i < blink_sig.size())
			{
			if(blink_sig[i].ToggleBlinker())
				i++;
			else
				blink_sig[i,i+1] = null;
			}
		Sleep(0.7);
		}
	}




public void SetProperties(Soup soup)
	{
	inherited(soup);
	}


public Soup GetProperties(void)
	{
	Soup retSoup = inherited();
	return retSoup;
	}


void ReUpdateSignals()
	{
	int i;
	for(i=0;i<Signals.N;i++)
		{
		zxSignal sign = (cast<zxSignalLink>(Signals.DBSE[i].Object)).sign;
		sign.UpdateState(0, -1);
		sign.OwnId = i;

		if(i % 50)
			Sleep(0.1);
		}

	Sleep(5);

	for(i=0;i<Signals.N;i++)
		{
		zxSignal sign = (cast<zxSignalLink>(Signals.DBSE[i].Object)).sign;
		sign.OwnId = i;

		Sniff(sign, "Object", "Enter", true);
		Sniff(sign, "Object", "Leave", true);
		Sniff(sign, "CTRL", "", true);

		if(sign.GetName() != Signals.DBSE[i].a)
			Interface.Exception("signal map name changed from "+Signals.DBSE[i].a+" to "+sign.GetName());
		}
	}


thread void SignalInitiation()			// запуск светофоров
	{
	Sleep(1);
	while(!All_added)
		{
		All_added = true;
		Sleep(2);
		}

	int i;
	for(i=0;i<Signals.N;i++)
		{
		(cast<zxSignalLink>(Signals.DBSE[i].Object)).sign.OwnId = i;
		}
	

	if(TrainzScript.GetTrainzBuild() >= 98695)
		ReUpdateSignals();

	}





thread void SpeedObjInitiation()			// запуск объектов ограничений скорости
	{
	Sleep(1);
	while(!All_speed_added)
		{
		All_speed_added=true;
		Sleep(1);
		}

	int i;
	for(i=0;i<SpeedObjects.N;i++)
		(cast<zxSpeedObject>(SpeedObjects.DBSE[i].Object)).OwnId = i;


	if(TrainzScript.GetTrainzBuild() >= 98695)
		{
		Sleep(10);

		for(i=0;i<SpeedObjects.N;i++)
			(cast<zxSpeedObject>(SpeedObjects.DBSE[i].Object)).OwnId = i;
		}
	}






void TrainStarting(Message msg)
	{
	Train curr_train=msg.src;

	if(MP_NotServer)
		return;


	if(!curr_train)  // поезд потерян
		{
		Interface.Exception("A train contains a bad vehicle!");
		return;
		}
	int train_id = curr_train.GetId();
	int train_nmb=train_arr.Find(train_id);

	if(train_nmb>=0)
		(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).IsStopped=false;

	}


void TrainStopping(Message msg)
	{
	Train curr_train=msg.src;

	if(MP_NotServer)
		return;

	if(!curr_train)  // поезд потерян
		{
		Interface.Exception("A train contains a bad vehicle!");
		return;
		}
	int train_id = curr_train.GetId();
	int train_nmb=train_arr.Find(train_id);

	if(train_nmb>=0)
		(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).IsStopped=true;
	}


/*


0 - поезд не найден

1 - поезд подъезжает к светофору
2 - поезд проезжает мимо светофора
3 - поезд проехал светофор

4 - поезд подъезжает с обратной стороны
5 - поезд проезжает мимо в обратном направлении от светофора
6 - поезд отъезжает в обратном направлении


*/


int SearchForTrain(zxSignal sig1, int train_id, int multiplicator) 	// тут идут поиски вперёд-назад от светофоров!
	{						// for_front - поиск головы/хвоста поезда
	Vehicle veh1;
	float vel_ty;
	Vehicle[] veh_arr;

	GSTrackSearch GSTS = sig1.BeginTrackSearch(true);
	MapObject MO = GSTS.SearchNext();

	bool train_found = false;

	while(MO and GSTS.GetDistance()<(str_distance*multiplicator) and !train_found)
		{
		if(MO.isclass(Vehicle))
			{
			int curr_train_id = (cast<Vehicle>MO).GetMyTrain().GetId();

			if(curr_train_id == train_id)
				train_found = true;
			else
				MO = GSTS.SearchNext();
			}
		else
			MO = GSTS.SearchNext();
		}

	bool before = false;
	bool behind = false;

	bool vel_dir = false;


	if(train_found and GSTS.GetDistance()<(str_distance*multiplicator))
		{
		behind = true;

		veh1= cast<Vehicle>MO;
		vel_ty = veh1.GetVelocity();

		if(GSTS.GetFacingRelativeToSearchDirection())
			vel_ty = -vel_ty;

		if(vel_ty < 0)
			vel_dir = true;
		}


	GSTS = sig1.BeginTrackSearch(false);
	MO = GSTS.SearchNext();

	train_found = false;


	while(MO and GSTS.GetDistance()<(str_distance*multiplicator)  and !train_found)
		{
		if(MO.isclass(Vehicle))
			{
			int curr_train_id = (cast<Vehicle>MO).GetMyTrain().GetId();

			if(curr_train_id == train_id)
				train_found = true;
			else
				MO = GSTS.SearchNext();
			}
		else
			MO = GSTS.SearchNext();
		}


	if(train_found and GSTS.GetDistance()<(str_distance*multiplicator))
		{
		before = true;

		veh1= cast<Vehicle>MO;
		vel_ty = veh1.GetVelocity();

		if(!GSTS.GetFacingRelativeToSearchDirection())
			vel_ty = -vel_ty;

		if(vel_ty < 0)
			vel_dir = true;
		}


	if(!behind and !before)			//поезд не найден
		return 0;


	if(vel_dir)
		{
		if(behind and before)
			return 2;
		else if(!behind and before)
			return 1;
		else if(behind and !before)
			return 3;
		}
	else
		{
		if(behind and before)
			return 5;
		else if(!behind and before)
			return 6;
		else if(behind and !before)
			return 4;
		}



	return 0;
	}



thread void CheckTrainList()			// проверка поездов, подъезжающих к светофорам
	{
	int q = 0;

	while(!MP_NotServer)
		{
		int i;
		int sleep_counter = 0;

		for(i=0;i<train_arr.N;i++)
			{
			TrainContainer TC= cast<TrainContainer>(train_arr.DBSE[i].Object);


			if(!TC.IsStopped)
				{
				int j = 0;
				bool any_not_found = false;


				while((j<TC.signal.size()) and (i<train_arr.N))
					{
					zxSignal sig1 = (cast<zxSignalLink>(Signals.DBSE[ (TC.signal[j]) ].Object)).sign;

					int state = TC.state[j];
/*

1 - поезд подъезжает к светофору
2 - поезд проезжает мимо светофора
3 - поезд проехал светофор

4 - поезд подъезжает с обратной стороны
5 - поезд проезжает мимо в обратном направлении от светофора
6 - поезд отъезжает в обратном направлении

*/


					int new_state = SearchForTrain(sig1,train_arr.DBSE[i].a, 1);


					if(new_state == 0 and TC.HighSpeed)
						{
						new_state = SearchForTrain(sig1,train_arr.DBSE[i].a, 2);
						any_not_found = true;
						}




					int priority;


					if( new_state != state)
						{
						priority = (cast<Train> (Router.GetGameObject(train_arr.DBSE[i].a) ) ).GetTrainPriorityNumber();

						if(priority > 1)
							priority = 2;
						}


					if(new_state == 2 and (state == 1 or state == 6 or state == 0) )
						{
						UpdateSignState(sig1,1,priority);
						sig1.train_is_l = true;
						}


					else if(new_state == 5 and (state == 3 or state == 4 or state == 0) )
						{
						UpdateSignState(sig1,3,priority);
						}


					else if((new_state == 3 and (state == 2 or state == 5)) or (new_state == 0 and state == 2))
						{
						UpdateSignState(sig1,2,priority);
						sig1.train_is_l = false;
						}

					else if((new_state == 6 and (state == 2 or state == 5)) or (new_state == 0 and state == 5))
						{
						UpdateSignState(sig1,4,priority);
						}

					else if((new_state == 3 and (state == 1 or state == 6)) or (new_state == 0 and state == 1))
						{
						UpdateSignState(sig1,1,priority);
						UpdateSignState(sig1,2,priority);
						sig1.train_is_l = false;
						}

					else if((new_state == 6 and (state == 3 or state == 4)) or (new_state == 0 and state == 4))
						{
						UpdateSignState(sig1,3,priority);
						UpdateSignState(sig1,4,priority);
						}

					if(new_state == 0 and state == 0)
						TrainCleaner(sig1, (cast<Train> (Router.GetGameObject(train_arr.DBSE[i].a) ) ), i, j, false );
					else
						{
						TC.state[j]=new_state;
						j++;
						}

					sleep_counter++;
					if(sleep_counter > 3)
						{
						sleep_counter = 0;
						Sleep(0.01);
						}


					}
				if(TC.HighSpeed and !any_not_found and (i<train_arr.N))
					(cast<TrainContainer>(train_arr.DBSE[i].Object)).HighSpeed = false;

				}
				
			}
		Sleep(0.5);

		}
	}







void SetClient()
	{
	AddHandler(me, "Object", "Enter", "");
	AddHandler(me, "Object", "Leave", "");
	AddHandler(me, "CTRL", "", "");

	AddHandler(me, "Train", "StartedMoving", "");
	AddHandler(me, "Train", "StoppedMoving", "");
	AddHandler(me, "Train", "Cleanup", "");

	int i,j;

	for(i = train_arr.N - 1; i >= 0; i--)
		{
		Train curr_train = cast<Train>(Router.GetGameObject(train_arr.DBSE[i].a));

		if(curr_train)
			{
			Sniff(curr_train, "Train", "StartedMoving", false);
			Sniff(curr_train, "Train", "StoppedMoving", false);
			Sniff(curr_train, "Train", "Cleanup", false);
			}
		
		TrainContainer train_con = cast<TrainContainer>(train_arr.DBSE[i].Object);

		train_con.signal[0, ] = null;
		train_con.state[0, ] = null;
		train_con.speed_object[0, ] = null;
		train_arr.DeleteElementByNmb(i);
		}

	train_arr.N = 0;
	train_arr.DBSE[0, ] = null;


	for(i = 0; i < Signals.N; i++)
		{
		(cast<zxSignalLink>(Signals.DBSE[i].Object)).sign.TC_id[0, ] = null;
		(cast<zxSignalLink>(Signals.DBSE[i].Object)).sign.MP_NotServer = true;
		}

	}





Soup GetChangeSoup()
	{
	Soup Temp_soup = Constructors.NewSoup();

	int i, j = 0;

	for(i = 0; i < Signals.N; i++)
		{
		if( sig_cache[i].MainState != (cast<zxSignalLink>(Signals.DBSE[i].Object)).sign.MainState)
			{

			zxSignal temp_sign = (cast<zxSignalLink>(Signals.DBSE[i].Object)).sign;

			Temp_soup.SetNamedTag("id"+j, Signals.DBSE[i].a );
			Temp_soup.SetNamedTag("state"+j,temp_sign.MainState);

			Temp_soup.SetNamedTag("limit"+j, temp_sign.speed_limit);
			Temp_soup.SetNamedTag("default_state"+j,  temp_sign.GetSpeedLimit());
			Temp_soup.SetNamedTag("train_open"+j,temp_sign.train_open);
			Temp_soup.SetNamedTag("shunt_open"+j,temp_sign.shunt_open);
			Temp_soup.SetNamedTag("barrier_closed"+j,temp_sign.barrier_closed);
			Temp_soup.SetNamedTag("wrong_dir"+j,temp_sign.wrong_dir);



			j++;
			}
		}

	Temp_soup.SetNamedTag("number",j);
	return Temp_soup;
	}


void SetChangeSoup(Soup sp)
	{
	int i;
	int N = sp.GetNamedTagAsInt("number",0);

	for(i = 0; i < N; i++)
		{
		int num = Signals.Find( sp.GetNamedTag("id"+i) );

		zxSignalLink signal_link = cast<zxSignalLink>(Signals.DBSE[num].Object);

		signal_link.sign.SetSpeedLimit( sp.GetNamedTagAsFloat("limit"+i, -1) );

		signal_link.sign.SetSignalState( sp.GetNamedTagAsInt("default_state"+i,2) , "");

		signal_link.sign.train_open = sp.GetNamedTagAsFloat("train_open"+i,false);
		signal_link.sign.shunt_open = sp.GetNamedTagAsFloat("shunt_open"+i,false);
		signal_link.sign.barrier_closed = sp.GetNamedTagAsFloat("barrier_closed"+i,false);
		signal_link.sign.wrong_dir = sp.GetNamedTagAsFloat("wrong_dir"+i,false);

		signal_link.sign.MainState = sp.GetNamedTagAsInt("state"+i, 0);
		signal_link.sign.SetSignal(false);
		}
	}








void SendMessagesToClients(Soup data, string type_msg)
	{
	if(!MP_started)
		return;

	data.SetNamedTag("type_msg",type_msg);

//	Interface.Print("message sended to client with type "+type_msg);

	MultiplayerGame.BroadcastGameplayMessage("sU_signals", "mult_client", data);
	}





void SendNewSignalSettings(string sig_name, int state, float limit, int default_state, bool train_open, bool shunt_open, bool wrong_dir, bool barrier_closed)
	{
	if(!MP_started)
		return;

	Soup Temp_soup = Constructors.NewSoup();

	Temp_soup.SetNamedTag("id",sig_name);
	Temp_soup.SetNamedTag("state",state);

	Temp_soup.SetNamedTag("limit",limit);
	Temp_soup.SetNamedTag("default_state",default_state);
	Temp_soup.SetNamedTag("train_open",train_open);
	Temp_soup.SetNamedTag("shunt_open",shunt_open);
	Temp_soup.SetNamedTag("wrong_dir",wrong_dir);
	Temp_soup.SetNamedTag("barrier_closed",barrier_closed);

	SendMessagesToClients(Temp_soup, "sU_SetSettings");
	}


void SendNewSignalSpeed(string sig_name, float speed)
	{
	if(!MP_started)
		return;


	Soup Temp_soup = Constructors.NewSoup();

	Temp_soup.SetNamedTag("id",sig_name);
	Temp_soup.SetNamedTag("limit",speed);

	SendMessagesToClients(Temp_soup, "sU_SetSpeed");
	}


void SendNewRepeaterSpeed(string rep_name, float speed)
	{
	if(!MP_started)
		return;


	Soup Temp_soup = Constructors.NewSoup();

	Temp_soup.SetNamedTag("id",rep_name);
	Temp_soup.SetNamedTag("limit",speed);

	SendMessagesToClients(Temp_soup, "sU_SetRepSpeed");
	}

void SendLimitSpeed(string rep_name, float speed, bool train_pass)
	{
	if(!MP_started)
		return;

	Soup Temp_soup = Constructors.NewSoup();

	Temp_soup.SetNamedTag("id",rep_name);
	Temp_soup.SetNamedTag("limit",speed);
	Temp_soup.SetNamedTag("train_pass",train_pass);

	SendMessagesToClients(Temp_soup, "sU_SetLimitSpeed");
	}


void MultiplayerClientHandler1(Message msg)
	{
	Soup sp = msg.paramSoup;

	string type = sp.GetNamedTag("type_msg");


//	Interface.Print("message to client with type "+type);



	if(type == "sU_SetSettings")
		{
		int num = Signals.Find( sp.GetNamedTag("id") );


		float speed_limit = sp.GetNamedTagAsFloat("limit", -1);

		zxSignalLink signal_link = cast<zxSignalLink>(Signals.DBSE[num].Object);


		signal_link.sign.SetSpeedLimit( sp.GetNamedTagAsFloat("limit", -1) );

		signal_link.sign.SetSignalState( sp.GetNamedTagAsInt("default_state",2) , "");

		signal_link.sign.train_open = sp.GetNamedTagAsFloat("train_open",false);
		signal_link.sign.shunt_open = sp.GetNamedTagAsFloat("shunt_open",false);
		signal_link.sign.barrier_closed = sp.GetNamedTagAsFloat("barrier_closed",false);
		signal_link.sign.wrong_dir = sp.GetNamedTagAsFloat("wrong_dir",false);

		signal_link.sign.MainState = sp.GetNamedTagAsInt("state", 0);
		signal_link.sign.SetSignal(false);


		if(zxExtra.size() > 0)
			{
			int i;
			for(i=0;i<zxExtra.size();i++)
				zxExtra[i].UpdateSignalState( (cast<zxSignalLink>(Signals.DBSE[num].Object)).sign , 0, -1);
			}

		}

	else if(type == "sU_SetSpeed")
		{
		int num = Signals.Find( sp.GetNamedTag("id") );
		
		(cast<zxSignalLink>(Signals.DBSE[num].Object)).sign.SetSpeedLimit( sp.GetNamedTagAsFloat("limit", -1) );

		
		}
	else if(type == "sU_SetRepSpeed")
		{
		zxSpeedBoard sp_board = cast<zxSpeedBoard>( Router.GetGameObject( sp.GetNamedTag("id") ) );
		sp_board.SetSpeedLimit(sp.GetNamedTagAsFloat("limit",-1));  //SetNewSpeed  , false
		}


	else if(type == "sU_SetLimitSpeed")
		{
		zxSpeedLimit sp_limit = cast<zxSpeedLimit>( Router.GetGameObject( sp.GetNamedTag("id") ) );
		sp_limit.SetSpeedLimit(sp.GetNamedTagAsFloat("limit",-1));	//SetLimitFor  , sp.GetNamedTagAsBool("train_pass"), false
		}

	else if(type == "sU_Sync")
		{
		SetChangeSoup(sp);
		}


	}



void SendMessageToServer(Soup data, string type_msg)
	{
	data.SetNamedTag("type_msg", type_msg);
	MultiplayerGame.SendGameplayMessageToServer("sU_signals", "mult_server", data);
	}



void MultiplayerServerHandler1(Message msg)
	{
	Soup Temp_soup = msg.paramSoup;

	string type = Temp_soup.GetNamedTag("type_msg");



	if(type == "sU_Sync_me")
		{
		string client = Temp_soup.GetNamedTag("__sender");
		Soup send_data = GetChangeSoup();
		send_data.SetNamedTag("type_msg","sU_Sync");

		MultiplayerGame.SendGameplayMessageToClient(client, "sU_signals", "mult_client", send_data);
		}
	}




void ServerInitBase()
	{
	int i;

	sig_cache = new zxSignal_Cache[Signals.N];
	for(i = 0; i < Signals.N; i++)
		{
		(cast<zxSignalLink>(Signals.DBSE[i].Object)).sign.IsServer = true;

		sig_cache[i] = new zxSignal_Cache();

		sig_cache[i].MainState = (cast<zxSignalLink>(Signals.DBSE[i].Object)).sign.MainState;
		}
	}

thread void Waiter()
	{
	while(MultiplayerGame.IsActive() and MultiplayerGame.IsLoadingClient())
		Sleep(5);

	if(MultiplayerGame.IsActive())
		{
		SetClient();
		Soup send_data = Constructors.NewSoup();
		SendMessageToServer(send_data, "sU_Sync_me");
		}
	}

void MultiplayerSessionHandler(Message msg)
	{
	if((msg.minor == "UsersChange" or msg.minor == "ClientReady") and MultiplayerGame.IsActive() )
		{

		if(!MP_started)
			{
			MP_started = true;

			if(!MultiplayerGame.IsServer())
				{
				MP_NotServer = true;

				AddHandler(me,"sU_signals", "mult_client","MultiplayerClientHandler1");

				Waiter();

				return;
				}

			ServerInitBase();
			AddHandler(me,"sU_signals", "mult_server" ,"MultiplayerServerHandler1");
			}
		}
	}



public string  LibraryCall(string function, string[] stringParam, GSObject[] objectParam)
	{
	if(!IsInited)
		{
		IsInited=true;

		// инициализация

		Signals = new BinarySortedArraySl();
		SpeedObjects = new BinarySortedArraySl();
		train_arr = new BinarySortedArrayIntu();
		Stations = new BinarySortedStrings();

		blink_sig = new zxSignal[0];


		zxExtra = new zxExtraLinkBase[0];

		ProtectGroups = new BinarySortedStrings();

		SignalInitiation();
		SpeedObjInitiation();
		AddHandler(me, "Object", "Enter", "TrainCatcher");
		AddHandler(me, "Object", "Leave", "TrainCleaner");
		AddHandler(me, "CTRL", "", "SignalControlHandler");



		AddHandler(me, "Train", "StartedMoving", "TrainStarting");
		AddHandler(me, "Train", "StoppedMoving", "TrainStopping");
		AddHandler(me, "Train", "Cleanup", "RemoveTrain");

		CheckTrainList();


		int i;
		tabl_str = new string[9];

		for(i=0;i<10;i++)
			tabl_str[i]="tabl"+i;



		KUID mplibKUID = me.GetAsset().LookupKUIDTable("mp_library");
		mp_lib = cast<MultiplayerSessionManager>World.GetLibrary(mplibKUID);
		if(mp_lib)
			Sniff(mp_lib, "MultiplayerSession", "", true);

		AddHandler(me, "MultiplayerSession", "", "MultiplayerSessionHandler");


		BlinkProcessing();
		}

	if(function=="name_str")
		{
		int i;
		for(i=0;i<10;i++)
			stringParam[i] = tabl_str[i];
		}

	else if(function=="add_station")		// запрос на добавление станции
		{

		if(Stations.AddElement(stringParam[0]) < 0)
			{
			return "false";
			}

		return "true";
		}

	else if(function=="delete_station")		// запрос на удаление станции
		{
		string stationnamedel = ""+stringParam[0];
		Stations.DeleteElement(stationnamedel);

		if(last_edited_station == stationnamedel)
			last_edited_station = Stations.SE[0];


		if(Stations.N>0);
			{
			string temp = Stations.SE[0];

			int i;
			for(i=0;i<Signals.N;i++)
				{
				if((cast<zxSignalLink>(Signals.DBSE[i].Object)).sign.stationName == stationnamedel)
					(cast<zxSignalLink>(Signals.DBSE[i].Object)).sign.stationName = temp + "";

				}
			}
		}


	else if(function=="station_exists")		// запрос на наличие станции
		{
		int number= Stations.Find( stringParam[0] );
		if(number>=0)
			{
			return "true";
			}
		return "false";

		}
	else if(function=="station_list")		// запрос на список станций
		{
		int i;

		for(i=0;i<Stations.N;i++)
			stringParam[i]=Stations.SE[i];

		return "";
		}


	else if(function=="station_count")		// запрос на список станций
		{
		return Stations.N+"";
		}


	else if(function=="station_by_id")		// запрос на список станций
		{
		return Stations.SE[( Str.ToInt(stringParam[0]) )];
		}


	else if(function=="station_edited_set")		// задание редактируемой станции
		{
		last_edited_station = stringParam[0];

		return "";
		}

	else if(function=="station_edited_find")		// задание редактируемой станции
		{
		return last_edited_station;
		}


	else if(function=="add_signal")		// механизм добавления сигнала
		{
		zxSignal curr_signal = cast<zxSignal>objectParam[0];

		if( !curr_signal  )
			{
			Interface.Exception("signal with error!");
			return "";
			}


		All_added=false;

		string name = stringParam[0]+"";				//проверяем наличие светофора в базе, добавляем его
		int number= Signals.Find(name);
		if(number>=0)
			{
			Interface.Log("Signal "+name+" has none-unique name");
			}
		else
			{
			zxSignalLink sign_link2= new zxSignalLink();
			number= Signals.AddElement(name,cast<GSObject>sign_link2);
			}

		if(number<0)
			{
			Interface.Exception("Can't add signal "+name);
			return "";
			}


		zxSignalLink sign_link = cast<zxSignalLink>(Signals.DBSE[number].Object);

		sign_link.sign = curr_signal;
		sign_link.sign.OwnId = -1;


		Sniff(curr_signal, "Object", "Enter", true);
		Sniff(curr_signal, "Object", "Leave", true);
		Sniff(curr_signal, "CTRL", "", true);


		return "true";

		}



	else if(function=="add_speed_object")		// механизм добавления сигнала
		{
		zxSpeedObject curr_speed_obj = cast<zxSpeedObject>objectParam[0];

		if( !curr_speed_obj  )
			{
			Interface.Exception("speed object with error!");
			return "";
			}


		All_speed_added=false;


		string name = curr_speed_obj.GetName();				//проверяем наличие скоростного ограничения в базе, добавляем его
		int number= SpeedObjects.Find(name);
		if(number>=0)
			{
			Interface.Log("Speed Object "+name+" has none-unique name");
			}
		else
			{
			number= SpeedObjects.AddElement(name,cast<GSObject>curr_speed_obj);
			}

		if(number<0)
			{
			Interface.Exception("Can't add signal "+name);
			return "";
			}


		zxSpeedObject speed_link = cast<zxSpeedObject>(SpeedObjects.DBSE[number].Object);
		speed_link.OwnId = -1;


		Sniff(curr_speed_obj, "Object", "Enter", true);
		Sniff(curr_speed_obj, "Object", "Leave", true);

		return "true";
		}


	else if(function=="find_next_signal")		// поиск сигнала с одновременной проверкой наличия поездов и маркеров
		{
		zxSignal sig1=cast<zxSignal>objectParam[0];

		if(!sig1)
			{
			Interface.Exception("signal with error!");
			return "";
			}

		GSTrackSearch GSTS = sig1.BeginTrackSearch(true);

		MapObject MO = GSTS.SearchNext();
		bool temp_dir;

		bool dirToFind = true;

		if(stringParam[1]=="reverse")
			dirToFind=false;

		stringParam[0] = "--";

		zxSignal temp_signal;

		int marker=0;
		zxMarker zxMrk;


		while(MO and !( MO.isclass(zxSignal) and GSTS.GetFacingRelativeToSearchDirection() == dirToFind and (cast<zxSignal>MO).IsObligatory()  )  )
			{
			temp_signal = cast<zxSignal>MO;

			if(temp_signal)
				{
				if(!temp_signal.Inited)
					return "";

				if(!temp_signal.barrier_closed)
					{

					if(GSTS.GetFacingRelativeToSearchDirection() == dirToFind and (temp_signal.Type & (zxSignal.ST_ROUTER+zxSignal.ST_OUT)) and (temp_signal.MainState == zxIndication.STATE_B)  )		// если есть маршрутный с синим
						{
						if(marker & zxMarker.MRHALFBL)
							marker = marker ^ zxMarker.MRHALFBL;
						}
					}
				else
					{
					if(GSTS.GetFacingRelativeToSearchDirection() == dirToFind and temp_signal.protect_influence)
						(stringParam[0])[1]='+';		
					}
				}


			if(MO.isclass(Vehicle) and !(marker & zxMarker.MRENDCONTROL))
				(stringParam[0])[0]='+';


			zxMrk= cast<zxMarker>MO;
			if(zxMrk and GSTS.GetFacingRelativeToSearchDirection() == true)
				{
				marker = marker | zxMrk.trmrk_flag;

				if((marker & zxMarker.MRT) and (marker & zxMarker.MRT18)  )
					marker = marker ^ zxMarker.MRT18;

				if(zxMrk.trmrk_flag & zxMarker.MRENDCONTROL)
					(stringParam[0])[0] = '-';
				}


			if(MO.isclass(Trackside) and !MO.isclass(Junction) and GSTS.GetDistance()>3000 )
				{
				temp_dir=GSTS.GetFacingRelativeToSearchDirection();
				GSTS = (cast<Trackside>MO).BeginTrackSearch(temp_dir);
				}


			if(! (marker & zxMarker.MRENDAB) )
				MO = GSTS.SearchNext();
			else
				MO = null;



			}

		stringParam[1] = marker+"";

		if(MO and MO.isclass(zxSignal) and GSTS.GetFacingRelativeToSearchDirection() == dirToFind and (cast<zxSignal>MO).IsObligatory())
			sig1.Cur_next=cast<zxSignal>MO;
		else
			{
			sig1.Cur_next=null;
			if(! (marker & zxMarker.MRENDAB) )
				(stringParam[0])[0]='+';
			}

		}
	else if(function=="find_prev_signal")
		{
		zxSignal sig1=cast<zxSignal>objectParam[0];

		if(!sig1)
			{
			Interface.Exception("signal with error!");
			return "";
			}

		GSTrackSearch GSTS = sig1.BeginTrackSearch(false);
		int old_main_state = sig1.MainState;

		MapObject MO = GSTS.SearchNext();
		bool temp_dir;

		bool dirToFind = true;

		if(stringParam[1]=="rev")
			dirToFind=false;

		zxSignal temp_signal;

		int marker=0;
		zxMarker zxMrk;

		stringParam[0] = "--";


		if(sig1.barrier_closed and sig1.protect_influence)
			(stringParam[0])[1]='+';

		bool blue_signal = false;


		while(MO and !( MO.isclass(zxSignal) and GSTS.GetFacingRelativeToSearchDirection() != dirToFind  and (cast<zxSignal>MO).IsObligatory() ) )
			{
			temp_signal = cast<zxSignal>MO;

			if(temp_signal)
				{
				if(!temp_signal.Inited)
					return "";

				if(!temp_signal.barrier_closed)
					{

					if(GSTS.GetFacingRelativeToSearchDirection() != dirToFind)
						{

						if((temp_signal.Type & (zxSignal.ST_ROUTER+zxSignal.ST_OUT) ) and (temp_signal.MainState == zxIndication.STATE_B))
							blue_signal=true;							// то ж-ж-ж не используем
						else
							{
							if(temp_signal.shunt_open and (temp_signal.MainState == zxIndication.STATE_R or temp_signal.MainState == zxIndication.STATE_B) and ((stringParam[0])[1]!='+'))
								temp_signal.UpdateState(0, -1);

							if(temp_signal.Type & zxSignal.ST_UNLINKED )
								temp_signal.UnlinkedUpdate(old_main_state);
							}
						}
					}
				else
					{
					if(GSTS.GetFacingRelativeToSearchDirection() != dirToFind and temp_signal.protect_influence)
						(stringParam[0])[1]='+';		
					}
				}

			


			if(MO.isclass(Vehicle) and !(marker & zxMarker.MRENDCONTROL))
				{
				(stringParam[0])[0]='+';
				}



			zxMrk= cast<zxMarker>MO;
			if(zxMrk and GSTS.GetFacingRelativeToSearchDirection() == false)
				{
				marker = marker | zxMrk.trmrk_flag;

				if((marker & zxMarker.MRT) and (marker & zxMarker.MRT18)  )
					marker = marker ^ zxMarker.MRT18;

				if((marker & zxMarker.MRHALFBL) and blue_signal)
					marker = marker ^ zxMarker.MRHALFBL;

				if(zxMrk.trmrk_flag & zxMarker.MRENDCONTROL)
					(stringParam[0])[0] = '-';
				}



			if(MO.isclass(Trackside) and !MO.isclass(Junction) and GSTS.GetDistance()>3000 )
				{
				temp_dir=GSTS.GetFacingRelativeToSearchDirection();
				GSTS = (cast<Trackside>MO).BeginTrackSearch(temp_dir);
				}

			if( !(marker & zxMarker.MRENDAB) )
				MO = GSTS.SearchNext();
			else
				MO = null;
			}

		if(MO and MO.isclass(zxSignal) and GSTS.GetFacingRelativeToSearchDirection() != dirToFind  and  (cast<zxSignal>MO).IsObligatory() )
			sig1.Cur_prev=cast<zxSignal>MO;
		else
			sig1.Cur_prev=null;

		stringParam[1] = marker+"";
		}

	else if(function=="find_any_next_signal")
		{

		zxSignal sig1=cast<zxSignal>objectParam[0];

		if(!sig1)
			{
			Interface.Exception("signal with error!");
			return "";
			}

		GSTrackSearch GSTS = sig1.BeginTrackSearch(true);

		MapObject MO = GSTS.SearchNext();
		
		while(MO and !MO.isclass(zxSignal))
			{
			MO = GSTS.SearchNext();
			}

		if(MO)
			return "true";

		return "false";
		}



	else if(function=="mult_settings")
		{
		zxSignal sig1=cast<zxSignal>objectParam[0];

		if(sig1)
			SendNewSignalSettings(sig1.GetName(), sig1.MainState, sig1.speed_limit, sig1.GetSignalState(), sig1.train_open, sig1.shunt_open, sig1.wrong_dir, sig1.barrier_closed);
		}



	else if(function=="mult_speed")
		{
		zxSignal sig1=cast<zxSignal>objectParam[0];

		if(sig1)
			SendNewSignalSpeed(sig1.GetName(), sig1.speed_limit);
		}




	else if(function=="speed_copy")
		{
		zxSignal sig1=cast<zxSignal>objectParam[0];

		if(!sig1 )
			{
			Interface.Exception("signal with error!");
			return "";
			}

		if(!temp_speed_sp)
			temp_speed_sp = Constructors.NewSoup();

		temp_speed_sp.Copy(sig1.speed_soup);


		}
	else if(function=="speed_paste")
		{
		if(!temp_speed_sp)
			return "";


		zxSignal sig1=cast<zxSignal>objectParam[0];

		if(!sig1 )
			{
			Interface.Exception("signal with error!");
			return "";
			}

		if(sig1.speed_soup.IsLocked())
			sig1.speed_soup = Constructors.NewSoup();

		sig1.speed_soup.Copy(temp_speed_sp);


		}
	else if(function=="new_speed")
		{

		if(MP_NotServer)
			return "";


		zxSignal sig1=cast<zxSignal>objectParam[0];

		if(!sig1 )
			{
			Interface.Exception("signal with error!");
			return "";
			}
		if((sig1.MainState == 0) or (sig1.MainState == zxIndication.STATE_B) or (sig1.Type & zxSignal.ST_UNLINKED) )
			{
			//Interface.Exception("error with call NewSpeed");
			return "";
			}


		GSTrackSearch GSTS = sig1.BeginTrackSearch(true);

		MapObject MO = GSTS.SearchNext();
		bool temp_dir;

		int prior = Str.ToInt(stringParam[0]);


		float last_set_speed = sig1.GetSpeedLimit();

		bool signal_out_speed = sig1.out_speed_set;
		zxSpeedBoard last_speedboard = null;


		int i = 0;
		while(MO and !( MO.isclass(Vehicle) and stringParam[1] != "-") )
			{

			if(GSTS.GetFacingRelativeToSearchDirection() == true)
				{		

				if(MO.isclass(zxSignal) and (cast<zxSignal>MO).speed_soup)
					{
					zxSignal sig2 = cast<zxSignal>MO;


					if( sig2.train_is_l)
						return "";


					if((sig2.MainState == zxIndication.STATE_B) or (sig2.MainState == 0) or (sig2.Type & zxSignal.ST_UNLINKED))
						{
						if(sig2.GetSpeedLimit() != last_set_speed)
							{
							sig2.speed_limit = last_set_speed;
							sig2.SetSpeedLimit(last_set_speed);

							if(MP_started)
								SendNewSignalSpeed(MO.GetName(), sig2.speed_limit);
							}
						}
					else
						{
						sig1 = sig2;


						if((sig1.MainState == zxIndication.STATE_R) or (sig1.MainState == zxIndication.STATE_Rx))
							return "";

						sig1.ApplyNewSpeedLimit(prior);
						last_set_speed = sig1.GetSpeedLimit();

						signal_out_speed = sig1.out_speed_set;
						last_speedboard = null;

					
						if( i == 0 )
							stringParam[1] = "";
						if(i>1)
							break;

						i++;

						}
					}

				else if(MO.isclass(zxSpeedBoard))
					{
					zxSpeedBoard temp_speed_board = (cast<zxSpeedBoard>MO);

					last_speedboard = temp_speed_board;

					temp_speed_board.prev_speed_pass = sig1.max_speed_pass;
					temp_speed_board.prev_speed_cargo = sig1.max_speed_cargo;


					temp_speed_board.UpdateSpeedboard(false);

					temp_speed_board.last_prior = prior;


					float curr_limit = temp_speed_board.max_speed_cargo;
					if(prior == 1)
						curr_limit = temp_speed_board.max_speed_pass;
					
					if(curr_limit == 0)
						curr_limit = last_set_speed;
					else
						last_set_speed = curr_limit;

					if(temp_speed_board.GetSpeedLimit() != curr_limit)
						{
						temp_speed_board.SetSpeedLimit(curr_limit);
	
						if(MP_started)
							SendNewRepeaterSpeed(MO.GetName(), curr_limit);
						}
					}
	
				else if(MO.isclass(zxSpeedLimit))
					{
					zxSpeedLimit temp_speed_limit = cast<zxSpeedLimit>MO;

					if(!temp_speed_limit.is_limit_start)
						{				// окончание ограничения скорости
						signal_out_speed = false;

						if(last_speedboard)	//ограничение по повторителю
							{
							temp_speed_limit.max_speed_pass = last_speedboard.max_speed_pass;
							temp_speed_limit.max_speed_cargo = last_speedboard.max_speed_cargo;
							}
						else
							{
							temp_speed_limit.max_speed_pass = sig1.max_speed_pass;
							temp_speed_limit.max_speed_cargo = sig1.max_speed_cargo;
							}
						}
					// в остальных случаях задаётся текущее ограничение



					float curr_limit = temp_speed_limit.max_speed_cargo;
					if(prior == 1)
						curr_limit = temp_speed_limit.max_speed_pass;
					
					if(curr_limit == 0)
						curr_limit = last_set_speed;
					else
						last_set_speed = curr_limit;

					temp_speed_limit.SetSpeedLimit(curr_limit);

					if(MP_started)
						SendLimitSpeed(MO.GetName(), curr_limit, prior == 1);

					}
				}


			if(MO.isclass(Trackside) and !MO.isclass(Junction) and GSTS.GetDistance()>3000 )
				{
				temp_dir=GSTS.GetFacingRelativeToSearchDirection();
				GSTS = (cast<Trackside>MO).BeginTrackSearch(temp_dir);
				}


			zxMarker zxMrk= cast<zxMarker>MO;
			if(!zxMrk or !(zxMrk.trmrk_flag & zxMarker.MRENDAB))
				MO = GSTS.SearchNext();
			else
				return "";
			}

		}
	else if(function=="new_speedboard_speed")
		{
		if(MP_NotServer)
			return "";

		zxSpeedBoard speedboard = cast<zxSpeedBoard>objectParam[0];

		int prior = speedboard.last_prior;		

		float curr_limit = speedboard.max_speed_cargo;
		if(prior == 1)
			curr_limit = speedboard.max_speed_pass;


		GSTrackSearch GSTS = speedboard.BeginTrackSearch(true);
		MapObject MO = GSTS.SearchNext();



		while(MO and !(MO.isclass(zxSignal) and GSTS.GetFacingRelativeToSearchDirection() == true and  !((cast<zxSignal>MO).Type & zxSignal.ST_UNLINKED) and ((cast<zxSignal>MO).MainState != zxIndication.STATE_B) and ((cast<zxSignal>MO).MainState != 0)  ) )
			{

			if(GSTS.GetFacingRelativeToSearchDirection() == true)
				{		

				if(MO.isclass(zxSignal))
					{
					zxSignal sig2 = cast<zxSignal>MO;

					if( sig2.train_is_l)
						return "";

					if(  (sig2.Type & zxSignal.ST_UNLINKED) or (sig2.MainState == zxIndication.STATE_B) or (sig2.MainState == 0))
						{
						if(sig2.GetSpeedLimit() != curr_limit)
							{
							sig2.speed_limit = curr_limit;
							sig2.SetSpeedLimit(curr_limit);

							if(MP_started)
								SendNewSignalSpeed(MO.GetName(), sig2.speed_limit);
							}
						}
					else
						return "";
					}

	
				else if(MO.isclass(zxSpeedLimit))
					{
					zxSpeedLimit temp_speed_limit = cast<zxSpeedLimit>MO;

					if(!temp_speed_limit.is_limit_start)
						{				// окончание ограничения скорости
						temp_speed_limit.max_speed_pass = speedboard.max_speed_pass;
						temp_speed_limit.max_speed_cargo = speedboard.max_speed_cargo;
						}
					// в остальных случаях задаётся текущее ограничение



					float curr_limit = temp_speed_limit.max_speed_cargo;
					if(prior == 1)
						curr_limit = temp_speed_limit.max_speed_pass;
					

					temp_speed_limit.SetSpeedLimit(curr_limit);

					if(MP_started)
						SendLimitSpeed(MO.GetName(), curr_limit, prior == 1);

					}

				}


			if(MO.isclass(Trackside) and !MO.isclass(Junction) and GSTS.GetDistance()>3000 )
				{
				bool temp_dir=GSTS.GetFacingRelativeToSearchDirection();
				GSTS = (cast<Trackside>MO).BeginTrackSearch(temp_dir);
				}


			zxMarker zxMrk= cast<zxMarker>MO;
			if(!zxMrk or !(zxMrk.trmrk_flag & zxMarker.MRENDAB))
				MO = GSTS.SearchNext();
			else
				return "";
			}
		}


	else if(function=="blink_start")
		{
		zxSignal sig1=cast<zxSignal>objectParam[0];

		int old_size = blink_sig.size();
		int i, old_pos = -1;

		for(i = 0; (i < old_size) and (old_pos < 0); i++)
			{
			if(blink_sig[i] == sig1)
				old_pos = i;
			}

		if(old_pos < 0)
			{
			blink_sig[old_size,old_size] = new zxSignal[1];
			blink_sig[old_size]= sig1;
			}

		}

	else if(function=="add_extra_obj")
		{
		int old_size = zxExtra.size();
		zxExtra[old_size,old_size] = new zxExtraLinkBase[1];
		zxExtra[old_size] = cast<zxExtraLinkBase>(cast<zxExtraLink>objectParam[0]);
		}


	else if(function=="add_extra_obj_base")
		{
		int old_size = zxExtra.size();
		zxExtra[old_size,old_size] = new zxExtraLinkBase[1];
		zxExtra[old_size] = (cast<zxExtraLinkContainer>objectParam[0]).extra_link;
		}


	else if(function=="add_protect")		// запрос на добавление группы заградительных
		{

		if(ProtectGroups.AddElement(stringParam[0]) < 0)
			return "false";
			
		return "true";
		}

	else if(function=="delete_protect")		// запрос на удаление групп
		{
		zxSignal sig1=cast<zxSignal>objectParam[0];

		if(sig1)
			{
			int prot_size = sig1.protect_soup.GetNamedTagAsInt("number",0);
			int i;

			for(i=0;i<prot_size;i++)
				{
				string sign_name = sig1.protect_soup.GetNamedTag(i+"");

				if(sign_name != sig1.GetName())
					{
					zxSignal TMP = cast<zxSignal>(Router.GetGameObject(sign_name));
					if(TMP)
						{
						TMP.protect_soup.Clear();
						TMP.ProtectGroup = "";
						}
					}
				}

			ProtectGroups.DeleteElement(sig1.ProtectGroup);
			sig1.protect_soup.Clear();
			sig1.ProtectGroup = "";
			}

		}


	else if(function=="protect_list")		// запрос на список групп
		{
		int i;
		int size1=ProtectGroups.N;

		for(i=0;i<size1;i++)
			stringParam[i]=ProtectGroups.SE[i]+"";

		return "";
		}

	else if(function=="protect_count")		// запрос на количество групп
		{
		return ProtectGroups.N+"";
		}

	else if(function=="add_protect_signal")
		{
		zxSignal sig1=cast<zxSignal>objectParam[0];
		
		if(!sig1)
			return "false";

		if(sig1.ProtectGroup != "")
			LibraryCall("delete_protect_signal", null, objectParam);


		int i = 0;

		int id = -1;

		while(i < Signals.N and id < 0)
			{
			if((cast<zxSignalLink>(Signals.DBSE[i].Object)).sign.ProtectGroup == stringParam[0])
				id = i;
			i++;
			}

		if(id >= 0)
			{
			Soup tempsoup = Constructors.NewSoup();
			tempsoup.Copy( (cast<zxSignalLink>(Signals.DBSE[id].Object)).sign.protect_soup );

			sig1.ProtectGroup = stringParam[0]+"";

			i=0;
			int N = tempsoup.GetNamedTagAsInt("number",0);

			int delta = 0;


			for(i=0;i<N;i++)
				{
				zxSignal temp = cast<zxSignal>(Router.GetGameObject(tempsoup.GetNamedTag(i+"")));
				if(!temp)
					delta++;
				else if(delta != 0)
					tempsoup.SetNamedTag( (i-delta)+"" , tempsoup.GetNamedTag(i+""));
				}

			N = N - delta;


			tempsoup.SetNamedTag( N+"" , sig1.GetName() );
			N++;

			tempsoup.SetNamedTag( "number", N);

			for(i=0;i<N;i++)
				{
				zxSignal temp = cast<zxSignal>(Router.GetGameObject(tempsoup.GetNamedTag(i+"")));
				
				if(temp.protect_soup)
					temp.protect_soup.Clear();
				else
					temp.protect_soup = Constructors.NewSoup();
				temp.protect_soup.Copy(tempsoup);
				}
			

			tempsoup.Clear();
			tempsoup = null;
			}
		else
			{
			int number= ProtectGroups.Find( stringParam[0]);
			if(number<0)
				{
				LibraryCall("add_protect", stringParam, null);
				}

			sig1.ProtectGroup = stringParam[0]+"";
			sig1.protect_soup.Clear();

			
			sig1.protect_soup.SetNamedTag( "0" , sig1.GetName() );
			sig1.protect_soup.SetNamedTag( "number" , 1 );
			}

		}
	else if(function=="delete_protect_signal")
		{
		zxSignal sig1=cast<zxSignal>objectParam[0];
		if(!sig1 or sig1.ProtectGroup == "")
			return "false";

		Soup tempsoup = Constructors.NewSoup();
		
		tempsoup.Copy(sig1.protect_soup);
		

		int i;
		int N = tempsoup.GetNamedTagAsInt("number",0);
		int delta = 0;


		for(i=0;i<N;i++)
			{
			zxSignal temp = cast<zxSignal>(Router.GetGameObject(tempsoup.GetNamedTag(i+"")));

			if(!temp or (tempsoup.GetNamedTag(i+"") == sig1.GetName()))
				delta++;
			else if(delta != 0)
				tempsoup.SetNamedTag( (i-delta)+"" , tempsoup.GetNamedTag(i+""));
			}

		N = N - delta;

		tempsoup.SetNamedTag("number",N);

		if(N == 0)
			ProtectGroups.DeleteElement(sig1.ProtectGroup);
		else
			{
			for(i=0;i<N;i++)
				{
				zxSignal temp = cast<zxSignal>(Router.GetGameObject(tempsoup.GetNamedTag(i+"")));

				temp.protect_soup.Clear();
				temp.protect_soup.Copy(tempsoup);
				}
			}

		sig1.ProtectGroup = "";
		sig1.protect_soup.Clear();

		tempsoup.Clear();
		tempsoup = null;

		}
	else if(function=="update_protect")
		{
		zxSignal sig1=cast<zxSignal>objectParam[0];
		if(!sig1 or sig1.ProtectGroup == "")
			return "false";

		Soup tempsoup = Constructors.NewSoup();
		
		tempsoup.Copy(sig1.protect_soup);
		

		int i;
		int N = tempsoup.GetNamedTagAsInt("number",0);
		int delta = 0;


		for(i=0;i<N;i++)
			{
			zxSignal temp = cast<zxSignal>(Router.GetGameObject(tempsoup.GetNamedTag(i+"")));

			if(!temp)
				delta++;
			else
				tempsoup.SetNamedTag( (i-delta)+"" , tempsoup.GetNamedTag(i+""));
			}

		N = N - delta;

		tempsoup.SetNamedTag("number",N);

		if(N == 0)
			ProtectGroups.DeleteElement(sig1.ProtectGroup);
		else
			{
			for(i=0;i<N;i++)
				{
				zxSignal temp = cast<zxSignal>(Router.GetGameObject(tempsoup.GetNamedTag(i+"")));

				temp.protect_soup.Clear();
				temp.protect_soup.Copy(tempsoup);
				}
			}
		}


	return "";
	}



};
