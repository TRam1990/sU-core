include "Library.gs"
include "Signal.gs"
include "Trigger.gs"
include "zx_specs.gs"
include "xtrainz02su.gs"
include "xtrainz02sl.gs"
include "xtrainzs.gs"

class zxLibruary_core isclass Library
{
public BinarySortedStrings Stations;		//массив станций
public BinarySortedArraySl Signals;		//массив сигналов
public BinarySortedArraySl OpenedSignals;	//массив открытых сигналов, 
						//перед которыми контроллируется поезд 

public BinarySortedArraySu train_arr; 



string err;

string last_edited_station="";


bool IsInited=false;

bool All_added=false;

Soup temp_speed_sp;

string[] tabl_str;


zxExtraLink[] zxExtra;


int SearchForTrain(zxSignal sig1, int train_id);



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


	if(msg.minor=="MayOpen^true" and !curr_sign.shunt_open and !(curr_sign.Type & zxSignal.ST_SHUNT))
		{
		curr_sign.train_open = true;
		UpdateSignState(curr_sign,0,-1);
		}
	else if(msg.minor=="ShuntMode.true" and !curr_sign.train_open)
		{
		curr_sign.shunt_open = true;
		UpdateSignState(curr_sign,0,-1);
		}
	else if(msg.minor=="MayOpen^false" and !(curr_sign.Type & zxSignal.ST_PERMOPENED))
		{
		curr_sign.train_open = false;
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
	if(!entered_sign)
		return;



	int number=entered_sign.OwnId;
	if(number<0)							// база светофоров ещё непроиндексирована, но уже построена
		number=Signals.Find(entered_sign.GetName(),false);

	Train curr_train=msg.src;

	if(!curr_train)  // поезд потерян
		{
		Interface.Exception("A train contains a bad vehicle!");
		return;
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


		(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal=new int[1];
		(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal[0]=number;
		(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).state=new int[1];
		(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).state[0]=0;


		if((train_arr.N+20) > train_arr.DBSE.size())
			train_arr.UdgradeArraySize(2*train_arr.DBSE.size());


		(cast<zxSignalLink>(Signals.DBSE[number].Object)).sign.AddTrainId(curr_train.GetId());


//LogTrainIdS(number);


		Sniff(curr_train, "Train", "StartedMoving", true);
		Sniff(curr_train, "Train", "StoppedMoving", true);
		Sniff(curr_train, "Train", "Cleanup", true);


//	err="added train " + name + " intNum " + train_nmb + " to sign "+number;
//	Interface.Log(err);


		}
	else				// такой поезд наехал на иной светофор
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
			(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).state[size1]=0;

			(cast<zxSignalLink>(Signals.DBSE[number].Object)).sign.AddTrainId(curr_train.GetId());


//	err="train intNum " + train_nmb + " to extra sign "+(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal[size1]+" size = "+(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal.size();
//	Interface.Log(err);

			}


		else
			{





//	err="train exist! ";
//	Interface.Log(err);



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

		

		(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal = null;
		(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).state = null;
		
		train_arr.DeleteElementByNmb(train_nmb);


		Sniff(curr_train, "Train", "StartedMoving", false);
		Sniff(curr_train, "Train", "StoppedMoving", false);
		Sniff(curr_train, "Train", "Cleanup", false);

//	err="removed train ! "+train_nmb;
//	Interface.Log(err);


		}
	}



void TrainCleaner(zxSignal entered_sign, Train curr_train) // ожидание съезда поезда с сигнала, ловля Object,Leave
	{
	if(!entered_sign)
		return;

	int number=entered_sign.OwnId;
	if(number<0)							// база светофоров ещё непроиндексирована
		number=Signals.Find(entered_sign.GetName(),false);

	if(!curr_train)  // поезд потерян
		{
		//Interface.Exception("A train contains a bad vehicle!");




		int n = entered_sign.TC_id.size();
		int i=0;

		while(i<n)
			{
			Train tr1 = cast<Train>(Router.GetGameObject( entered_sign.TC_id[i] ));

			if(!tr1)
				{
				int train_id1 = entered_sign.TC_id[i];
				int train_nmb=train_arr.Find( train_id1+"" ,false);


				entered_sign.RemoveTrainId(curr_train.GetId());
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
			
			int train_position = SearchForTrain(entered_sign, curr_train.GetId() );

			if(train_position != 2 and train_position != 5)
				{
				(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal[num1,num1+1]=null;
				(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).state[num1,num1+1]=null;

			
				(cast<zxSignalLink>(Signals.DBSE[number].Object)).sign.RemoveTrainId(curr_train.GetId());

				UpdateSignState( (cast<zxSignalLink>(Signals.DBSE[number].Object)).sign,5,-1);




//	err="removed train intNum " + train_nmb + " from sign "+number;
//	Interface.Log(err);


				if((cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal.size()==0)
					{

					train_arr.DeleteElementByNmb(train_nmb);
	
	
					Sniff(curr_train, "Train", "StartedMoving", false);
					Sniff(curr_train, "Train", "StoppedMoving", false);
					Sniff(curr_train, "Train", "Cleanup", false);

//	err="removed train ! "+train_nmb;
//	Interface.Log(err);

	
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


int SearchForTrain(zxSignal sig1, int train_id) 	// тут идут поиски вперёд-назад от светофоров!    
	{						// for_front - поиск головы/хвоста поезда
	Vehicle veh1;
	float vel_ty;
	Vehicle[] veh_arr;

	GSTrackSearch GSTS = sig1.BeginTrackSearch(true);

	MapObject MO = GSTS.SearchNext();

	while(MO and GSTS.GetDistance()<40 and !(MO.isclass(Vehicle) and (cast<Vehicle>MO).GetMyTrain().GetId() ==  train_id  ))
		{
		MO = GSTS.SearchNext();
		}


	bool before = false;
	bool behind = false;

	bool vel_dir = false;



	if(MO and (MO.isclass(Vehicle) and (cast<Vehicle>MO).GetMyTrain().GetId() ==  train_id  )  ) 		// часть поезда за светофором
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

	while(MO and GSTS.GetDistance()<40 and !(MO.isclass(Vehicle) and (cast<Vehicle>MO).GetMyTrain().GetId() ==  train_id  ))
		{
		MO = GSTS.SearchNext();
		}





	if(MO and (MO.isclass(Vehicle)  and (cast<Vehicle>MO).GetMyTrain().GetId() ==  train_id  ) )		// часть поезда перед светофором
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
	while(1)
		{
		int i;
		for(i=0;i<train_arr.N;i++)
			{
			TrainContainer TC= cast<TrainContainer>(train_arr.DBSE[i].Object);


			if(!TC.IsStopped)
				{

				int j;

				for(j=0;j<TC.signal.size();j++)
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
					int new_state = SearchForTrain(sig1,Str.ToInt(train_arr.DBSE[i].a));


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
						TrainCleaner(sig1, (cast<Train> (Router.GetGameObject( Str.ToInt(train_arr.DBSE[i].a) ) ) )  );


					
					TC.state[j]=new_state;

					}
				}
			}
		Sleep(0.5);
		}
	}






public string  LibraryCall(string function, string[] stringParam, GSObject[] objectParam) 
	{
	if(!IsInited)
		{
		IsInited=true;

		// инициализация

		Signals=new BinarySortedArraySl();
		Signals.UdgradeArraySize(20);

		train_arr=new BinarySortedArraySu();
		train_arr.UdgradeArraySize(20);

		Stations=new BinarySortedStrings();
		Stations.UdgradeArraySize(20);

		zxExtra = new zxExtraLink[0];

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
			//Interface.Exception("station "+stringParam[0]+" already exist!");
			
			return "false";
			}
		//Interface.Log("'"+stringParam[0]+"'");

		
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
		int size1=Stations.N;

		

		for(i=0;i<size1;i++)
			stringParam[i]=Stations.SE[i];
			
		return size1+"";
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

//	err="added sign " + Signals.DBSE[number].a + " intNum "+number;
//	Interface.Log(err);

		


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

		int TypeToFind = Str.ToInt(stringParam[0]);
		bool dirToFind = true;

		if(stringParam.size()>1 and stringParam[1]=="reverse")
			dirToFind=false;


		int marker=0;
		zxMarker zxMrk;


		while(MO and !( MO.isclass(zxSignal) and GSTS.GetFacingRelativeToSearchDirection() == dirToFind and (((cast<zxSignal>MO).Type & TypeToFind) == TypeToFind) and  !((cast<zxSignal>MO).Type & zxSignal.ST_UNLINKED and !((cast<zxSignal>MO).Type & zxSignal.ST_OUT  and !(cast<zxSignal>MO).train_open)   ) and ((cast<zxSignal>MO).MainState != 19)  )  )   // синий и не входящий в цепи пропускаем
			{

			if(MO.isclass(zxSignal))
				{
				if(!(cast<zxSignal>MO).Inited)
					return "";


				if(GSTS.GetFacingRelativeToSearchDirection() == dirToFind and ((cast<zxSignal>MO).Type & (zxSignal.ST_ROUTER+zxSignal.ST_OUT)) and ((cast<zxSignal>MO).MainState == 19)  )		// если есть маршрутный с синим		
					{
					if(marker % 10 == 7)
						{
						marker = marker - 7;												// то ж-ж-ж не используем

						if(marker >=10)
							marker = marker/10;
						}
					}

				}



			if(MO.isclass(Vehicle) or ((MO.isclass(zxSignal) and (((cast<zxSignal>MO).Type & zxSignal.ST_ZAGRAD) == zxSignal.ST_ZAGRAD) and  (cast<zxSignal>MO).MainState == 1) )  )
				stringParam[0]="+";




			zxMrk= cast<zxMarker>MO;
			if(zxMrk and GSTS.GetFacingRelativeToSearchDirection() == true)
				{
				int n_mrk= zxMrk.trmrk_mod;

				if((int)(n_mrk / 10) == 1)		// маркер номера невидим
					{
					n_mrk = n_mrk - 10;
					}

				if(n_mrk == 1)
					{

					if( (int)(marker / 10) == 2)
						marker=marker - 10;

					else if(marker % 10 == 0)
						marker = 1;

					else if( (int)(marker / 10) == 0 )
						marker=marker + 10;
					}
				else if(n_mrk == 2)
					{
					if((int)(marker / 10) == 0 and marker != 1)
						{
						if(marker % 10 == 0)
							marker=marker + 2;
						else
							marker=marker + 20;
						}
					}
				else if(n_mrk != 0 and n_mrk != (marker % 10) )		// выбор последнего маркера
					{

					if(marker == 1)
						{
						marker= 10;
						}
					else if(marker == 2)

						marker = 20;


					marker = 10*(int)(marker / 10) + n_mrk;						
					}
				}


			if(MO.isclass(Trackside) and !MO.isclass(Junction) and GSTS.GetDistance()>3000 )
				{
				temp_dir=GSTS.GetFacingRelativeToSearchDirection();
				GSTS = (cast<Trackside>MO).BeginTrackSearch(temp_dir);
				}


			if( marker % 10 != 8 )
				MO = GSTS.SearchNext();
			else
				MO = null;

			

			}

		stringParam[1] = marker+"";

		if(!MO or (((cast<zxSignal>MO).Type & TypeToFind)!=TypeToFind) or GSTS.GetFacingRelativeToSearchDirection() != dirToFind)
			sig1.Cur_next=null;
		else
			sig1.Cur_next=cast<zxSignal>MO;


		
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

		int TypeToFind = Str.ToInt(stringParam[0]);
		bool dirToFind = true;

		if(stringParam.size()>1 and stringParam[1]=="reverse")
			dirToFind=false;

		int marker=0;
		zxMarker zxMrk;


		bool blue_signal = false;


		while(MO and !( MO.isclass(zxSignal) and GSTS.GetFacingRelativeToSearchDirection() != dirToFind  and (((cast<zxSignal>MO).Type & TypeToFind) == TypeToFind) and  !((cast<zxSignal>MO).Type & zxSignal.ST_UNLINKED and !((cast<zxSignal>MO).Type & zxSignal.ST_OUT  and !(cast<zxSignal>MO).train_open)   )   and !((cast<zxSignal>MO).MainState == 19) ))
			{
			if(MO.isclass(zxSignal))
				{
				if(!(cast<zxSignal>MO).Inited)
					return "";

				if(GSTS.GetFacingRelativeToSearchDirection() != dirToFind and ((cast<zxSignal>MO).Type & (zxSignal.ST_ROUTER+zxSignal.ST_OUT) ) and ((cast<zxSignal>MO).MainState == 19))
					blue_signal=true;							// то ж-ж-ж не используем


				if(GSTS.GetFacingRelativeToSearchDirection() != dirToFind and ((cast<zxSignal>MO).Type & zxSignal.ST_UNLINKED) )
					(cast<zxSignal>MO).UnlinkedUpdate(old_main_state);


				}




			if(MO.isclass(Vehicle) or ((MO.isclass(zxSignal) and (((cast<zxSignal>MO).Type & zxSignal.ST_ZAGRAD) == zxSignal.ST_ZAGRAD) and  (cast<zxSignal>MO).MainState == 1)  )  )
				stringParam[0]="+";



			zxMrk= cast<zxMarker>MO;
			if(zxMrk and GSTS.GetFacingRelativeToSearchDirection() == false)
				{
				int n_mrk= zxMrk.trmrk_mod;

				if((int)(n_mrk / 10) == 1)		// маркер номера невидим
					{
					n_mrk = n_mrk - 10;
					}

				if(n_mrk == 1)
					{

					if( (int)(marker / 10) == 2)
						marker=marker - 10;

					else if(marker % 10 == 0)
						marker = 1;

					else if( (int)(marker / 10) == 0 )
						marker=marker + 10;
					}
				else if(n_mrk == 2)
					{
					if((int)(marker / 10) == 0 and marker != 1)
						{
						if(marker % 10 == 0)
							marker=marker + 2;
						else
							marker=marker + 20;
						}
					}
				else if(n_mrk != 0 and ( (marker% 10) == 0 or marker == 1 or marker == 2) )
					{

					if(marker == 1)
						{
						marker= 10;
						}
					else if(marker == 2)

						marker = 20;


					if(n_mrk == 7)
						{
						if(!blue_signal)
							marker = 10*(int)(marker / 10) + 7;
						else
							marker= marker/10;
						}
					else
						marker = 10*(int)(marker / 10) + n_mrk;						

					}
				}



			if(MO.isclass(Trackside) and !MO.isclass(Junction) and GSTS.GetDistance()>3000 )
				{
				temp_dir=GSTS.GetFacingRelativeToSearchDirection();
				GSTS = (cast<Trackside>MO).BeginTrackSearch(temp_dir);
				}

			if( marker % 10 != 8 )
				MO = GSTS.SearchNext();
			else
				MO = null;
			}

		if(!MO or (((cast<zxSignal>MO).Type & TypeToFind)!=TypeToFind) or GSTS.GetFacingRelativeToSearchDirection() == dirToFind)
			sig1.Cur_prev=null;
		else
			sig1.Cur_prev=cast<zxSignal>MO;

		stringParam[1] = marker+"";
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

		zxSignal sig1=cast<zxSignal>objectParam[0];

	//	Interface.Log("speed setted "+stringParam[0]);


		if(!sig1 )
			{
			Interface.Exception("signal with error!");
			return "";
			}
		if( sig1.MainState == 19)
			return "";

//Interface.Print("sign" +sig1.privateName+"@"+sig1.stationName  +" train "+stringParam[0] );

		GSTrackSearch GSTS = sig1.BeginTrackSearch(true);
	
		MapObject MO = GSTS.SearchNext();
		bool temp_dir;

		float limit;

		if(stringParam.size()>1 and stringParam[1]=="-")
			{
			limit = sig1.GetSpeedLim(Str.ToInt(stringParam[0]));
			}
		else
			{
			limit = sig1.SetSpeedLim(Str.ToInt(stringParam[0]));
			
			}

		int i=0;


		while(MO and !( MO.isclass(Vehicle) and  !(stringParam.size()>1 and stringParam[1]=="-" and i==0)) and !(i>1 and MO.isclass(zxSignal) and GSTS.GetFacingRelativeToSearchDirection() == true and  (!((cast<zxSignal>MO).Type & zxSignal.ST_UNLINKED)) and (!((cast<zxSignal>MO).MainState == 19))  ) )
			{

			if(limit > 0 and MO.isclass(zxSpeedBoard) )
				{
				(cast<zxSpeedBoard>MO).SetNewSpeed(limit, false);

				}

			if(MO.isclass(zxSignal) and GSTS.GetFacingRelativeToSearchDirection() == true and (cast<zxSignal>MO).speed_soup)
				{
				if( (cast<zxSignal>MO).train_is_l)
					return "";


				if(  ((cast<zxSignal>MO).Type & zxSignal.ST_UNLINKED) or ((cast<zxSignal>MO).MainState == 19))
					{
					//if( limit!= 0)
						(cast<zxSignal>MO).SetSpeedLimit( -1 );
					}
				else
					{
					limit = (cast<zxSignal>MO).SetSpeedLim(Str.ToInt(stringParam[0])) ;

//Interface.Print("main limit " +(cast<zxSignal>MO).privateName+"@"+(cast<zxSignal>MO).stationName+" lim "+ limit);



					if( ((cast<zxSignal>MO).MainState == 0) or ((cast<zxSignal>MO).MainState == 1) or ((cast<zxSignal>MO).MainState == 2))
						return "";
					i++;
					}
				}



			if(MO.isclass(Trackside) and !MO.isclass(Junction) and GSTS.GetDistance()>3000 )
				{
				temp_dir=GSTS.GetFacingRelativeToSearchDirection();
				GSTS = (cast<Trackside>MO).BeginTrackSearch(temp_dir);
				}


			zxMarker zxMrk= cast<zxMarker>MO;
			if(!zxMrk or (zxMrk.trmrk_mod % 10 ) != 8 )
				MO = GSTS.SearchNext();
			else
				return "";
			}		

		}
	else if(function=="add_extra_obj")
		{
		zxExtra[zxExtra.size(),zxExtra.size()+1]=new zxExtraLink[0];
		zxExtra[(zxExtra.size()-1)]= cast<zxExtraLink> objectParam[0];
		}


	
	return "";
	}



};