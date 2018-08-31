include "Library.gs"
include "Signal.gs"
include "Trigger.gs"
include "zx_specs.gs"
include "xtrainz02su.gs"
include "xtrainz02sl.gs"
include "xtrainzs.gs"
include "multiplayersessionmanager.gs"


include "zx_specs.gs"
include "zx_mrk.gs"
include "zx_router.gs"
include "zx_signal.gs"
include "zx_speedboard.gs"

class zxLibruary_core isclass Library
{

public BinarySortedArraySl Signals;											//массив сигналов
public BinarySortedArraySu train_arr;											//массив поездов


public BinarySortedStrings Stations;										//массив станций
public BinarySortedStrings ProtectGroups;									//массив групп заградительных

MultiplayerSessionManager mp_lib;

public float str_distance = 40.0;

string err;
string last_edited_station = "";

bool IsInited=false;
bool All_added=false;

public bool MP_started = false;
public bool MP_NotServer = false;											// не является сервером в мультиплеерной игре (отключение логики)

zxSignal_Cache[] sig_cache;

bool objectRunningDriver = false;
Soup temp_speed_sp;
string[] tabl_str;

zxExtraLink[] zxExtra;


int SearchForTrain(zxSignal sig1, int train_id, int multiplicator);
void SendMessagesToClients(Soup data, string type);
void SendMessageToServer(Soup data, string type);

void UpdateSignState(zxSignal zxSign, int state, int priority)
	{
	zxSign.UpdateState(state,priority);

	if(zxExtra.size() > 0)
		{
		int i;
		for(i=0;i<zxExtra.size();i++)
			zxExtra[i].UpdateSignalState(zxSign, state, priority);
		}

	}


void SignalControlHandler(Message msg)//приём заданий на открытость-закрытость светофора
	{
	zxSignal curr_sign=cast<zxSignal>(msg.dst);

	if(!curr_sign)
		return;

	if(curr_sign.Type & zxSignal.ST_PROTECT)
		{
		if(msg.minor=="MayOpen^true")
			{
			if(curr_sign.ProtectGroup == "")
				{
				curr_sign.barrier_closed = false;
				UpdateSignState(curr_sign,0,-1);
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
				UpdateSignState(curr_sign,0,-1);
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
			UpdateSignState(curr_sign,0,-1);
			}
		else if(msg.minor=="MayOpen^false" and !(curr_sign.Type & zxSignal.ST_PERMOPENED))
			{
			curr_sign.train_open = false;
			UpdateSignState(curr_sign,0,-1);
			}
		}

	if(msg.minor=="ShuntMode.true" and !curr_sign.train_open)
		{
		curr_sign.shunt_open = true;
		UpdateSignState(curr_sign,0,-1);
		}
	else if(msg.minor=="ShuntMode.false" or msg.minor=="Close")
		{
		curr_sign.shunt_open = false;
		UpdateSignState(curr_sign,0,-1);
		}

	else if(msg.minor[0,4]=="ALS-")
		{
		curr_sign.code_freq= Str.ToInt(msg.minor[4,]);
		}


	}


void LogTrainIdS(int number)
	{
	string log1="";

	int n = (cast<zxSignalLink>(Signals.DBSE[number].Object)).sign.TC_id.size();
	int i;

	for(i=0;i<n;i++)
		log1=log1+" "+(cast<zxSignalLink>(Signals.DBSE[number].Object)).sign.TC_id[i];

	Interface.Log("signal! "+(cast<zxSignalLink>(Signals.DBSE[number].Object)).sign.GetName()+log1);

	}


void TrainCatcher(Message msg) // ожидание наезда поезда на сигнал, ловля Object,Enter
	{
	zxSignal entered_sign=cast<zxSignal>(msg.dst);
	if(!entered_sign or MP_NotServer)
		return;



	int number=entered_sign.OwnId;
	if(number<0)							// база светофоров ещё непроиндексирована, но уже построена
		number=Signals.Find(entered_sign.GetName(),false);

	Train curr_train=msg.src;

	if(!curr_train )  // поезд потерян
		{
		Interface.Exception("A train contains a bad vehicle!");
		return;
		}

	int state1 = SearchForTrain(entered_sign, curr_train.GetId(), 1 );
	bool high_speed = false;

	if(state1 == 0)
		{
		state1 = SearchForTrain(entered_sign, curr_train.GetId(), 2 );
		high_speed = true;		
		if(state1 == 0)
			{
			Interface.Print("Unable to find a train at "+ entered_sign.privateName + "@" + entered_sign.stationName);
			return;	
			}
		}

	string name =curr_train.GetId()+"";
	int train_nmb=train_arr.Find(name,false);

	if(train_nmb<0)
		{
		TrainContainer[] ts4=new TrainContainer[1];
		ts4[0]= new TrainContainer();

		train_arr.AddElement(name,cast<GSObject>ts4[0]);

		train_nmb= train_arr.Find(name,false);
		if(train_nmb<0)
			{
			Interface.Exception("Can't add train "+name);
			return;
			}

		Vehicle[] veh_arr=curr_train.GetVehicles();

		bool stopped=false;
		if(veh_arr.size()>0 and veh_arr[0] and veh_arr[0].GetVelocity()==0)
			stopped=true;

		(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).IsStopped=stopped;

		(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).HighSpeed=high_speed;

		(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal=new int[1];
		(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal[0]=number;
		(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).state=new int[1];
		(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).state[0]=state1;


		if((train_arr.N+20) > train_arr.DBSE.size())
			train_arr.UdgradeArraySize(2*train_arr.DBSE.size());


		(cast<zxSignalLink>(Signals.DBSE[number].Object)).sign.AddTrainId(curr_train.GetId());

		Sniff(curr_train, "Train", "StartedMoving", true);
		Sniff(curr_train, "Train", "StoppedMoving", true);
		Sniff(curr_train, "Train", "Cleanup", true);

		}
	else				// такой поезд уже наехал на светофор
		{
		int i=0;
		bool exist=false;
		int size1 = (cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal.size();

		while(i<size1 and !exist)
			{
			if((cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal[i] == number)
				exist=true;
			i++;
			}

		if(!exist)		// но не на этот
			{
			(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal[size1,size1+1]=new int[1];
			(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).state[size1,size1+1]=new int[1];

			(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal[size1]=number;
			(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).state[size1]=state1;

			(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).HighSpeed=high_speed;

			(cast<zxSignalLink>(Signals.DBSE[number].Object)).sign.AddTrainId(curr_train.GetId());
			}


		else
			{

			}

		}

	}



void RemoveTrain(Message msg)
	{

	Train curr_train=msg.src;

	if(!curr_train)  // поезд потерян
		{
		Interface.Exception("A train contains a bad vehicle!");
		return;
		}
	string name =curr_train.GetId()+"";
	int train_nmb=train_arr.Find(name,false);

	if(train_nmb>=0)	// поезд, стоящий на светофоре, ещё не удалён
		{
		int i = 0;

		for(i=0;i<(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal.size();i++)
			{
			int number = (cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal[i];

			UpdateSignState( (cast<zxSignalLink>(Signals.DBSE[number].Object)).sign,5,-1);
			(cast<zxSignalLink>(Signals.DBSE[number].Object)).sign.RemoveTrainId(curr_train.GetId());
			}



		(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal[0, ] = null;
		(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).state[0, ] = null;

		train_arr.DeleteElementByNmb(train_nmb);


		Sniff(curr_train, "Train", "StartedMoving", false);
		Sniff(curr_train, "Train", "StoppedMoving", false);
		Sniff(curr_train, "Train", "Cleanup", false);

		}
	}



void TrainCleaner(zxSignal entered_sign, Train curr_train) // ожидание съезда поезда с сигнала, ловля Object,Leave
	{
	if(!entered_sign or MP_NotServer)
		return;

	int number=entered_sign.OwnId;
	if(number<0)							// база светофоров ещё непроиндексирована
		number=Signals.Find(entered_sign.GetName(),false);

	if(!curr_train)  // поезд потерян
		{
		Interface.Print("A train was deletted or contains a bad vehicle!");


		int n = entered_sign.TC_id.size();
		int i=0;

		while(i<n)						// сборщик мусора
			{
			Train tr1 = cast<Train>(Router.GetGameObject( entered_sign.TC_id[i] ));

			if(!tr1)
				{
				int train_id1 = entered_sign.TC_id[i];
				int train_nmb=train_arr.Find( train_id1+"" ,false);


				entered_sign.RemoveTrainId(train_id1);
				UpdateSignState(entered_sign,5,-1);

				train_arr.DeleteElementByNmb(train_nmb);
				}
			else
				i++;
			}


		return;
		}

	string name =curr_train.GetId()+"";
	int train_nmb=train_arr.Find(name,false);

	if(train_nmb>=0)
		{

		int i = 0;
		int num1 = -1;
		int size1 = (cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal.size();
		while(i<size1 and num1<0)
			{
			if((cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal[i] == number)
				num1 = i;
			i++;
			}

		if(num1>=0)		// поезд действительно наехал на этот светофор
			{

					// проверка того, что поезд только с одной стороны от светофора

			int q = 1;

			if((cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).HighSpeed)
				q = 2;


			int train_position = SearchForTrain(entered_sign, curr_train.GetId(), q );

			if(  train_position == 0 and (cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).state[num1] == 0  )
				{

				(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal[num1,num1+1]=null;
				(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).state[num1,num1+1]=null;;

				(cast<zxSignalLink>(Signals.DBSE[number].Object)).sign.RemoveTrainId(curr_train.GetId());


				UpdateSignState( (cast<zxSignalLink>(Signals.DBSE[number].Object)).sign,5,-1);


				if((cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal.size()==0)
					{
					train_arr.DeleteElementByNmb(train_nmb);

					Sniff(curr_train, "Train", "StartedMoving", false);
					Sniff(curr_train, "Train", "StoppedMoving", false);
					Sniff(curr_train, "Train", "Cleanup", false);
					}
				}
			}
		}
	}



void TrainCleaner(Message msg) // ожидание съезда поезда с сигнала, ловля Object,Leave
	{
	zxSignal entered_sign=cast<zxSignal>(msg.dst);
	Train curr_train=msg.src;

	TrainCleaner( entered_sign, curr_train );
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



thread void SignalInitiation()			// запуск светофоров
	{
	Sleep(1);
	while(!All_added)
		{
		All_added = true;
		Sleep(1);
		}

	int i;
	for(i=0;i<Signals.N;i++)
		{
		(cast<zxSignalLink>(Signals.DBSE[i].Object)).sign.OwnId = i;
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
	string name =curr_train.GetId()+"";
	int train_nmb=train_arr.Find(name,false);

	if(train_nmb>=0)
		{
		(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).IsStopped=false;
		}

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
	string name =curr_train.GetId()+"";
	int train_nmb=train_arr.Find(name,false);

	if(train_nmb>=0)
		{
		(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).IsStopped=true;
		}
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

	while(MO and GSTS.GetDistance()<(str_distance*multiplicator) and !(MO.isclass(Vehicle) and (cast<Vehicle>MO).GetMyTrain().GetId() ==  train_id  ))
		{
		MO = GSTS.SearchNext();
		}


	bool before = false;
	bool behind = false;

	bool vel_dir = false;



	if(MO and GSTS.GetDistance()<(str_distance*multiplicator) and (MO.isclass(Vehicle) and (cast<Vehicle>MO).GetMyTrain().GetId() ==  train_id  )  ) 		// часть поезда за светофором
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

	while(MO and GSTS.GetDistance()<(str_distance*multiplicator) and !(MO.isclass(Vehicle) and (cast<Vehicle>MO).GetMyTrain().GetId() ==  train_id  ))
		{
		MO = GSTS.SearchNext();
		}


	if(MO and GSTS.GetDistance()<(str_distance*multiplicator) and (MO.isclass(Vehicle)  and (cast<Vehicle>MO).GetMyTrain().GetId() ==  train_id  ) )		// часть поезда перед светофором
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
	while(!MP_NotServer)
		{
		int i;
		for(i=0;i<train_arr.N;i++)
			{
			TrainContainer TC= cast<TrainContainer>(train_arr.DBSE[i].Object);


			if(!TC.IsStopped)
				{

				int j = 0;
				bool any_not_found = false;

				while(j<TC.signal.size())
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


					int new_state = SearchForTrain(sig1,Str.ToInt(train_arr.DBSE[i].a), 1);


					if(new_state == 0 and TC.HighSpeed)
						{
						new_state = SearchForTrain(sig1,Str.ToInt(train_arr.DBSE[i].a), 2);
						any_not_found = true;
						}

					//Interface.Log("usual check "+sig1.privateName + "@" + sig1.stationName+ " state "+state+" new state "+new_state);



					int priority;


					if( new_state != state)
						{
						priority = (cast<Train> (Router.GetGameObject( Str.ToInt(train_arr.DBSE[i].a) ) ) ).GetTrainPriorityNumber();

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
						{
						TrainCleaner(sig1, (cast<Train> (Router.GetGameObject( Str.ToInt(train_arr.DBSE[i].a) ) ) )  );
						}
					else
						{
						TC.state[j]=new_state;
						j++;
						}

					}
				if(TC.HighSpeed and !any_not_found)
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
		int train_ID = Str.ToInt(train_arr.DBSE[i].a);
		
		(cast<TrainContainer>(train_arr.DBSE[i].Object)).signal[0, ] = null;
		(cast<TrainContainer>(train_arr.DBSE[i].Object)).state[0, ] = null;
		train_arr.DeleteElementByNmb(i);


		Train curr_train = cast<Train>(Router.GetGameObject(train_ID));

		if(curr_train)
			{
			Sniff(curr_train , "Train", "StartedMoving", false);
			Sniff(curr_train, "Train", "StoppedMoving", false);
			Sniff(curr_train, "Train", "Cleanup", false);
			}
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
		int num = Signals.Find( sp.GetNamedTag("id"+i) ,false);


		(cast<zxSignalLink>(Signals.DBSE[num].Object)).sign.SetSpeedLim( sp.GetNamedTagAsFloat("limit"+i, -1) );

		(cast<zxSignalLink>(Signals.DBSE[num].Object)).sign.SetSignalState( sp.GetNamedTagAsInt("default_state"+i,2) , "");


		(cast<zxSignalLink>(Signals.DBSE[num].Object)).sign.train_open = sp.GetNamedTagAsFloat("train_open"+i,false);
		(cast<zxSignalLink>(Signals.DBSE[num].Object)).sign.shunt_open = sp.GetNamedTagAsFloat("shunt_open"+i,false);
		(cast<zxSignalLink>(Signals.DBSE[num].Object)).sign.barrier_closed = sp.GetNamedTagAsFloat("barrier_closed"+i,false);
		(cast<zxSignalLink>(Signals.DBSE[num].Object)).sign.wrong_dir = sp.GetNamedTagAsFloat("wrong_dir"+i,false);



		(cast<zxSignalLink>(Signals.DBSE[num].Object)).sign.MainState = sp.GetNamedTagAsInt("state"+i, 0);
		(cast<zxSignalLink>(Signals.DBSE[num].Object)).sign.SetSignal(false);

		}
	}








void SendMessagesToClients(Soup data, string type_msg)
	{
	data.SetNamedTag("type_msg",type_msg);

//	Interface.Print("message sended to client with type "+type_msg);


	MultiplayerGame.BroadcastGameplayMessage("sU_signals", "mult_client", data);
	}





void SendNewSignalSettings(string sig_name, int state, float limit, int default_state, bool train_open, bool shunt_open, bool wrong_dir, bool barrier_closed)
	{
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
	Soup Temp_soup = Constructors.NewSoup();

	Temp_soup.SetNamedTag("id",sig_name);
	Temp_soup.SetNamedTag("limit",speed);

	SendMessagesToClients(Temp_soup, "sU_SetSpeed");
	}


void SendNewRepeaterSpeed(string rep_name, float speed)
	{
	Soup Temp_soup = Constructors.NewSoup();

	Temp_soup.SetNamedTag("id",rep_name);
	Temp_soup.SetNamedTag("limit",speed);

	SendMessagesToClients(Temp_soup, "sU_SetRepSpeed");
	}


void MultiplayerClientHandler1(Message msg)
	{
	Soup sp = msg.paramSoup;

	string type = sp.GetNamedTag("type_msg");


//	Interface.Print("message to client with type "+type);



	if(type == "sU_SetSettings")
		{
		int num = Signals.Find( sp.GetNamedTag("id") ,false);


		float speed_limit = sp.GetNamedTagAsFloat("limit", -1);

		(cast<zxSignalLink>(Signals.DBSE[num].Object)).sign.SetSpeedLim( sp.GetNamedTagAsFloat("limit", -1) );


		(cast<zxSignalLink>(Signals.DBSE[num].Object)).sign.SetSignalState( sp.GetNamedTagAsInt("default_state",2) , "");


		(cast<zxSignalLink>(Signals.DBSE[num].Object)).sign.train_open = sp.GetNamedTagAsFloat("train_open",false);
		(cast<zxSignalLink>(Signals.DBSE[num].Object)).sign.shunt_open = sp.GetNamedTagAsFloat("shunt_open",false);
		(cast<zxSignalLink>(Signals.DBSE[num].Object)).sign.barrier_closed = sp.GetNamedTagAsFloat("barrier_closed",false);
		(cast<zxSignalLink>(Signals.DBSE[num].Object)).sign.wrong_dir = sp.GetNamedTagAsFloat("wrong_dir",false);



		(cast<zxSignalLink>(Signals.DBSE[num].Object)).sign.MainState = sp.GetNamedTagAsInt("state", 0);
		(cast<zxSignalLink>(Signals.DBSE[num].Object)).sign.SetSignal(false);


		if(zxExtra.size() > 0)
			{
			int i;
			for(i=0;i<zxExtra.size();i++)
				zxExtra[i].UpdateSignalState( (cast<zxSignalLink>(Signals.DBSE[num].Object)).sign , 0, -1);
			}

		}

	else if(type == "sU_SetSpeed")
		{
		int num = Signals.Find( sp.GetNamedTag("id") ,false);
		
		(cast<zxSignalLink>(Signals.DBSE[num].Object)).sign.SetSpeedLim( sp.GetNamedTagAsFloat("limit", -1) );

		
		}
	else if(type == "sU_SetRepSpeed")
		{
		zxSpeedBoard sp_board = cast<zxSpeedBoard>( Router.GetGameObject( sp.GetNamedTag("id") ) );
		sp_board.SetNewSpeed(sp.GetNamedTagAsFloat("limit",-1), false);
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
		Signals.UdgradeArraySize(20);

		train_arr = new BinarySortedArraySu();
		train_arr.UdgradeArraySize(20);

		Stations = new BinarySortedStrings();
		Stations.UdgradeArraySize(20);

		zxExtra = new zxExtraLink[0];

		ProtectGroups = new BinarySortedStrings();
		ProtectGroups.UdgradeArraySize(10); 

		SignalInitiation();
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
		Sniff(mp_lib, "MultiplayerSession", "", true);

		AddHandler(me, "MultiplayerSession", "", "MultiplayerSessionHandler");
		}

	if(function=="name_str")
		{
		int i;
		for(i=0;i<10;i++)
			stringParam[i] = tabl_str[i];
		}

	else if(function=="add_station")		// запрос на добавление станции
		{

		if(!Stations.AddElement(stringParam[0]))
			{
			return "false";
			}


		if((Stations.N+20) > Stations.SE.size())			// расширяем массив
			Stations.UdgradeArraySize(2*Stations.SE.size());


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


	if(function=="station_exists")		// запрос на наличие станции
		{
		int number= Stations.Find( stringParam[0],false);
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
		if( !(cast<zxSignal>objectParam[0]) )
			{
			Interface.Exception("signal with error!");
			return "";
			}


		All_added=false;

		string name = stringParam[0]+"";				//проверяем наличие светофора в базе, добавляем его
		int number= Signals.Find(name,false);
		if(number>=0)
			{
			Interface.Log("Signal "+name+" has none-unique name");
			}
		else
			{

			zxSignalLink[] sign_link= new zxSignalLink[1];
			sign_link[0]= new zxSignalLink();

			Signals.AddElement(name,cast<GSObject>sign_link[0]);
			}

		number= Signals.Find(name,false);
		if(number<0)
			{
			Interface.Exception("Can't add signal "+name);
			return "";
			}



		(cast<zxSignalLink>(Signals.DBSE[number].Object)).sign = cast<zxSignal>objectParam[0];
		(cast<zxSignalLink>(Signals.DBSE[number].Object)).sign.OwnId = -1;


		if((Signals.N+20) > Signals.DBSE.size())			// расширяем массив
			Signals.UdgradeArraySize(2*Signals.DBSE.size());



		Sniff(objectParam[0], "Object", "Enter", true);
		Sniff(objectParam[0], "Object", "Leave", true);
		Sniff(objectParam[0], "CTRL", "", true);


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

		int marker=0;
		zxMarker zxMrk;


		while(MO and !( MO.isclass(zxSignal) and GSTS.GetFacingRelativeToSearchDirection() == dirToFind and (cast<zxSignal>MO).IsObligatory()  )  )
			{

			if(MO.isclass(zxSignal))
				{
				if(!(cast<zxSignal>MO).Inited)
					return "";

				if(!(cast<zxSignal>MO).barrier_closed)
					{

					if(GSTS.GetFacingRelativeToSearchDirection() == dirToFind and ((cast<zxSignal>MO).Type & (zxSignal.ST_ROUTER+zxSignal.ST_OUT)) and ((cast<zxSignal>MO).MainState == 19)  )		// если есть маршрутный с синим
						{
						if(marker & zxMarker.MRHALFBL)
							marker = marker ^ zxMarker.MRHALFBL;
						}
					}
				else
					{
					if(GSTS.GetFacingRelativeToSearchDirection() == dirToFind and (cast<zxSignal>MO).protect_influence)
						(stringParam[0])[1]='+';		
					}


				}



			if(MO.isclass(Vehicle))
				(stringParam[0])[0]='+';




			zxMrk= cast<zxMarker>MO;
			if(zxMrk and GSTS.GetFacingRelativeToSearchDirection() == true)
				{
				marker = marker | zxMrk.trmrk_flag;

				if((marker & zxMarker.MRT) and (marker & zxMarker.MRT18)  )
					marker = marker ^ zxMarker.MRT18;	
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
			sig1.Cur_next=null;



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

		int marker=0;
		zxMarker zxMrk;

		stringParam[0] = "--";


		if(sig1.barrier_closed and sig1.protect_influence)
			(stringParam[0])[1]='+';

		bool blue_signal = false;


		while(MO and !( MO.isclass(zxSignal) and GSTS.GetFacingRelativeToSearchDirection() != dirToFind  and (cast<zxSignal>MO).IsObligatory() ) )
			{
			if(MO.isclass(zxSignal))
				{
				if(!(cast<zxSignal>MO).Inited)
					return "";

				if(!(cast<zxSignal>MO).barrier_closed)
					{


					if(GSTS.GetFacingRelativeToSearchDirection() != dirToFind and ((cast<zxSignal>MO).Type & (zxSignal.ST_ROUTER+zxSignal.ST_OUT) ) and ((cast<zxSignal>MO).MainState == 19))
						{
						int old_m_st = sig1.MainState;

						if(old_m_st != 0 and old_m_st != 1 and old_m_st != 2 and old_m_st != 3 and old_m_st != 20)
							{
							sig1.Cur_prev=cast<zxSignal>MO;
							stringParam[1] = marker+"";
							return "";
							}
						blue_signal=true;							// то ж-ж-ж не используем
						}

					if(GSTS.GetFacingRelativeToSearchDirection() != dirToFind and (cast<zxSignal>MO).shunt_open and ((cast<zxSignal>MO).MainState == 1 or (cast<zxSignal>MO).MainState == 19) and ((stringParam[0])[1]!='+'))
						(cast<zxSignal>MO).UpdateState(0, -1);


					if(GSTS.GetFacingRelativeToSearchDirection() != dirToFind and ((cast<zxSignal>MO).Type & zxSignal.ST_UNLINKED) )
						(cast<zxSignal>MO).UnlinkedUpdate(old_main_state);
	
					}
				else
					{
					if(GSTS.GetFacingRelativeToSearchDirection() != dirToFind and (cast<zxSignal>MO).protect_influence)
						(stringParam[0])[1]='+';		
					}
				}

			


			if(MO.isclass(Vehicle))
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




	else if(function=="mult_settings")
		{
		zxSignal sig1=cast<zxSignal>objectParam[0];

		if(sig1)
			{
			SendNewSignalSettings(sig1.GetName(), sig1.MainState, sig1.speed_limit, sig1.GetSignalState(), sig1.train_open, sig1.shunt_open, sig1.wrong_dir, sig1.barrier_closed);
			}
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
		if( sig1.MainState == 19 )
			{
			Interface.Exception("error with call NewSpeed");

			return "";
			}


		GSTrackSearch GSTS = sig1.BeginTrackSearch(true);

		MapObject MO = GSTS.SearchNext();
		bool temp_dir;

		float limit = sig1.GetSpeedLim(Str.ToInt(stringParam[0]));

		int i = 0;


		while(MO and !( MO.isclass(Vehicle) and stringParam[1] != "-") and !(i>1 and MO.isclass(zxSignal) and GSTS.GetFacingRelativeToSearchDirection() == true and  (!((cast<zxSignal>MO).Type & zxSignal.ST_UNLINKED)) and (!((cast<zxSignal>MO).MainState == 19))  ) )
			{
			if(MO.isclass(zxSpeedBoard))
				{
				(cast<zxSpeedBoard>MO).SetNewSpeed(limit, false);

				if(MP_started)
					SendNewRepeaterSpeed(MO.GetName(), limit);
				}
					

			if(MO.isclass(zxSignal) and GSTS.GetFacingRelativeToSearchDirection() == true and (cast<zxSignal>MO).speed_soup)
				{
				if( (cast<zxSignal>MO).train_is_l)
					return "";


				if(  ((cast<zxSignal>MO).Type & zxSignal.ST_UNLINKED) or ((cast<zxSignal>MO).MainState == 19))
					{

					if((cast<zxSignal>MO).SetSpeedLim(0))
						{
						if(MP_started)
							SendNewSignalSpeed(MO.GetName(), (cast<zxSignal>MO).speed_limit);
						}
					}
				else
					{
					if( ((cast<zxSignal>MO).MainState == 0) or ((cast<zxSignal>MO).MainState == 1) or ((cast<zxSignal>MO).MainState == 2))
						return "";


					limit = (cast<zxSignal>MO).GetSpeedLim(Str.ToInt(stringParam[0]));


					if( (cast<zxSignal>MO).SetSpeedLim(limit) )
						{
						if(MP_started)
							SendNewSignalSpeed(MO.GetName(), limit);
						}

					
					if( i == 0 )
						stringParam[1] = "";

					i++;
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
	else if(function=="add_extra_obj")
		{
		int old_size = zxExtra.size();
		zxExtra[old_size,old_size+1] = new zxExtraLink[1];
		zxExtra[old_size]= cast<zxExtraLink>objectParam[0];
		}




	else if(function=="add_protect")		// запрос на добавление группы заградительных
		{

		if(!ProtectGroups.AddElement(stringParam[0]))
			return "false";
			
		if((ProtectGroups.N+20) > ProtectGroups.SE.size())			// расширяем массив
			ProtectGroups.UdgradeArraySize(2*ProtectGroups.SE.size());

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
			int number= ProtectGroups.Find( stringParam[0],false);
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