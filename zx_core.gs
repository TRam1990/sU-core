include "Library.gs"
include "Signal.gs"
include "Trigger.gs"
include "zx_specs.gs"
include "xtrainz02su.gs"
include "xtrainz02sl.gs"
include "xtrainzs.gs"

class zxLibruary_core isclass Library
{
public BinarySortedStrings Stations;		//������ �������
public BinarySortedArraySl Signals;		//������ ��������

public BinarySortedArraySu train_arr;


public float str_distance = 40.0;


string err;

string last_edited_station="";


bool IsInited=false;

bool All_added=false;

Soup temp_speed_sp;

string[] tabl_str;

zxExtraLink[] zxExtra;

public BinarySortedStrings ProtectGroups;


int SearchForTrain(zxSignal sig1, int train_id, int multiplicator);



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


void SignalControlHandler(Message msg)//���� ������� �� ����������-���������� ���������
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


void TrainCatcher(Message msg) // �������� ������ ������ �� ������, ����� Object,Enter
	{
	zxSignal entered_sign=cast<zxSignal>(msg.dst);
	if(!entered_sign)
		return;



	int number=entered_sign.OwnId;
	if(number<0)							// ���� ���������� ��� ������������������, �� ��� ���������
		number=Signals.Find(entered_sign.GetName(),false);

	Train curr_train=msg.src;

	if(!curr_train )  // ����� �������
		{
		Interface.Exception("A train contains a bad vehicle!");
		return;
		}

	int state1 = SearchForTrain(entered_sign, curr_train.GetId(), 1 );

	if(state1 == 0)
		{
		state1 = SearchForTrain(entered_sign, curr_train.GetId(), 2 );
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
	else				// ����� ����� ��� ������ �� ��������
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

		if(!exist)		// �� �� �� ����
			{
			(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal[size1,size1+1]=new int[1];
			(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).state[size1,size1+1]=new int[1];

			(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).signal[size1]=number;
			(cast<TrainContainer>(train_arr.DBSE[train_nmb].Object)).state[size1]=state1;

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

	if(!curr_train)  // ����� �������
		{
		Interface.Exception("A train contains a bad vehicle!");
		return;
		}
	string name =curr_train.GetId()+"";
	int train_nmb=train_arr.Find(name,false);

	if(train_nmb>=0)	// �����, ������� �� ���������, ��� �� �����
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



void TrainCleaner(zxSignal entered_sign, Train curr_train) // �������� ������ ������ � �������, ����� Object,Leave
	{
	if(!entered_sign)
		return;

	int number=entered_sign.OwnId;
	if(number<0)							// ���� ���������� ��� ������������������
		number=Signals.Find(entered_sign.GetName(),false);

	if(!curr_train)  // ����� �������
		{
		Interface.Print("A train was deletted or contains a bad vehicle!");


		int n = entered_sign.TC_id.size();
		int i=0;

		while(i<n)
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

		if(num1>=0)		// ����� ������������� ������ �� ���� ��������
			{

					// �������� ����, ��� ����� ������ � ����� ������� �� ���������

			int train_position = SearchForTrain(entered_sign, curr_train.GetId(), 1 );

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



void TrainCleaner(Message msg) // �������� ������ ������ � �������, ����� Object,Leave
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



thread void SignalInitiation()			// ������ ����������
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

	if(!curr_train)  // ����� �������
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

	if(!curr_train)  // ����� �������
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


0 - ����� �� ������

1 - ����� ���������� � ���������
2 - ����� ��������� ���� ���������
3 - ����� ������� ��������

4 - ����� ���������� � �������� �������
5 - ����� ��������� ���� � �������� ����������� �� ���������
6 - ����� ��������� � �������� �����������


*/


int SearchForTrain(zxSignal sig1, int train_id, int multiplicator) 	// ��� ���� ������ �����-����� �� ����������!
	{						// for_front - ����� ������/������ ������
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



	if(MO and GSTS.GetDistance()<(str_distance*multiplicator) and (MO.isclass(Vehicle) and (cast<Vehicle>MO).GetMyTrain().GetId() ==  train_id  )  ) 		// ����� ������ �� ����������
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





	if(MO and GSTS.GetDistance()<(str_distance*multiplicator) and (MO.isclass(Vehicle)  and (cast<Vehicle>MO).GetMyTrain().GetId() ==  train_id  ) )		// ����� ������ ����� ����������
		{
		before = true;

		veh1= cast<Vehicle>MO;
		vel_ty = veh1.GetVelocity();


		if(!GSTS.GetFacingRelativeToSearchDirection())
			vel_ty = -vel_ty;


		if(vel_ty < 0)
			vel_dir = true;


		}




	if(!behind and !before)			//����� �� ������
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



thread void CheckTrainList()			// �������� �������, ������������ � ����������
	{
	while(1)
		{
		int i;
		for(i=0;i<train_arr.N;i++)
			{
			TrainContainer TC= cast<TrainContainer>(train_arr.DBSE[i].Object);


			if(!TC.IsStopped)
				{

				int j = 0;

				while(j<TC.signal.size())
					{
					zxSignal sig1 = (cast<zxSignalLink>(Signals.DBSE[ (TC.signal[j]) ].Object)).sign;

					int state = TC.state[j];
/*

1 - ����� ���������� � ���������
2 - ����� ��������� ���� ���������
3 - ����� ������� ��������

4 - ����� ���������� � �������� �������
5 - ����� ��������� ���� � �������� ����������� �� ���������
6 - ����� ��������� � �������� �����������


*/
					int new_state = SearchForTrain(sig1,Str.ToInt(train_arr.DBSE[i].a), 1);

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

		// �������������

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

		}

	if(function=="name_str")
		{
		int i;
		for(i=0;i<10;i++)
			stringParam[i] = tabl_str[i];
		}

	else if(function=="add_station")		// ������ �� ���������� �������
		{

		if(!Stations.AddElement(stringParam[0]))
			{
			return "false";
			}


		if((Stations.N+20) > Stations.SE.size())			// ��������� ������
			Stations.UdgradeArraySize(2*Stations.SE.size());


		return "true";
		}

	else if(function=="delete_station")		// ������ �� �������� �������
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


	if(function=="station_exists")		// ������ �� ������� �������
		{
		int number= Stations.Find( stringParam[0],false);
		if(number>=0)
			{
			return "true";
			}
		return "false";

		}
	else if(function=="station_list")		// ������ �� ������ �������
		{
		int i;

		for(i=0;i<Stations.N;i++)
			stringParam[i]=Stations.SE[i];

		return "";
		}


	else if(function=="station_count")		// ������ �� ������ �������
		{
		return Stations.N+"";
		}


	else if(function=="station_by_id")		// ������ �� ������ �������
		{
		return Stations.SE[( Str.ToInt(stringParam[0]) )];
		}


	else if(function=="station_edited_set")		// ������� ������������� �������
		{
		last_edited_station = stringParam[0];

		return "";
		}

	else if(function=="station_edited_find")		// ������� ������������� �������
		{
		return last_edited_station;
		}


	else if(function=="add_signal")		// �������� ���������� �������
		{
		if( !(cast<zxSignal>objectParam[0]) )
			{
			Interface.Exception("signal with error!");
			return "";
			}


		All_added=false;

		string name = stringParam[0]+"";				//��������� ������� ��������� � ����, ��������� ���
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


		if((Signals.N+20) > Signals.DBSE.size())			// ��������� ������
			Signals.UdgradeArraySize(2*Signals.DBSE.size());



		Sniff(objectParam[0], "Object", "Enter", true);
		Sniff(objectParam[0], "Object", "Leave", true);
		Sniff(objectParam[0], "CTRL", "", true);


		return "true";

		}


	else if(function=="find_next_signal")		// ����� ������� � ������������� ��������� ������� ������� � ��������
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

		stringParam[0] = "--";

		int marker=0;
		zxMarker zxMrk;


		while(MO and !( MO.isclass(zxSignal) and GSTS.GetFacingRelativeToSearchDirection() == dirToFind and (((cast<zxSignal>MO).Type & TypeToFind) == TypeToFind) and  !(((cast<zxSignal>MO).Type & zxSignal.ST_UNLINKED or (cast<zxSignal>MO).barrier_closed) and  !((cast<zxSignal>MO).Type & zxSignal.ST_OUT  and !(cast<zxSignal>MO).train_open)   ) and ((cast<zxSignal>MO).MainState != 19)  )  )   // ����� � �� �������� � ���� ����������
			{

			if(MO.isclass(zxSignal))
				{
				if(!(cast<zxSignal>MO).barrier_closed)
					{
					if(!(cast<zxSignal>MO).Inited)
						return "";


					if(GSTS.GetFacingRelativeToSearchDirection() == dirToFind and ((cast<zxSignal>MO).Type & (zxSignal.ST_ROUTER+zxSignal.ST_OUT)) and ((cast<zxSignal>MO).MainState == 19)  )		// ���� ���� ���������� � �����
						{
						if(marker % 10 == 7)
							{
							marker = marker - 7;												// �� �-�-� �� ����������

							if(marker >=10)
								marker = marker/10;
							}
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
				int n_mrk= zxMrk.trmrk_mod;

				if((int)(n_mrk / 10) == 1)		// ������ ������ �������
					{
					n_mrk = n_mrk - 10;
					}

				if(n_mrk == 1)
					{

					if( (int)(marker / 10) == 2)
						marker=marker - 10;

					else if(marker % 10 == 0 or marker % 10 == 2)
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
				else if(n_mrk != 0 and n_mrk != (marker % 10) )		// ����� ���������� �������
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

		stringParam[0] = "--";


		if(sig1.barrier_closed and sig1.protect_influence)
			(stringParam[0])[1]='+';

		bool blue_signal = false;


		while(MO and !( MO.isclass(zxSignal) and GSTS.GetFacingRelativeToSearchDirection() != dirToFind  and (((cast<zxSignal>MO).Type & TypeToFind) == TypeToFind) and  !( ((cast<zxSignal>MO).Type & zxSignal.ST_UNLINKED or (cast<zxSignal>MO).barrier_closed) and !((cast<zxSignal>MO).Type & zxSignal.ST_OUT  and !(cast<zxSignal>MO).train_open)   )   and !((cast<zxSignal>MO).MainState == 19) ))
			{
			if(MO.isclass(zxSignal))
				{
				if(!(cast<zxSignal>MO).barrier_closed)
					{
					if(!(cast<zxSignal>MO).Inited)
						return "";

					if(GSTS.GetFacingRelativeToSearchDirection() != dirToFind and ((cast<zxSignal>MO).Type & (zxSignal.ST_ROUTER+zxSignal.ST_OUT) ) and ((cast<zxSignal>MO).MainState == 19))
						blue_signal=true;							// �� �-�-� �� ����������

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
				int n_mrk= zxMrk.trmrk_mod;

				if((int)(n_mrk / 10) == 1)		// ������ ������ �������
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
		int old_size = zxExtra.size();
		zxExtra[old_size,old_size+1] = new zxExtraLink[1];
		zxExtra[old_size]= cast<zxExtraLink>objectParam[0];
		}




	else if(function=="add_protect")		// ������ �� ���������� ������ ��������������
		{

		if(!ProtectGroups.AddElement(stringParam[0]))
			return "false";
			
		if((ProtectGroups.N+20) > ProtectGroups.SE.size())			// ��������� ������
			ProtectGroups.UdgradeArraySize(2*ProtectGroups.SE.size());

		return "true";
		}

	else if(function=="delete_protect")		// ������ �� �������� �����
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


	else if(function=="protect_list")		// ������ �� ������ �����
		{
		int i;
		int size1=ProtectGroups.N;

		for(i=0;i<size1;i++)
			stringParam[i]=ProtectGroups.SE[i]+"";

		return "";
		}

	else if(function=="protect_count")		// ������ �� ���������� �����
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
				else
					tempsoup.SetNamedTag( (i-delta)+"" , tempsoup.GetNamedTag(i+""));
				}

			N = N - delta;


			tempsoup.SetNamedTag( N+"" , sig1.GetName() );
			N++;

			tempsoup.SetNamedTag( "number", N);

			for(i=0;i<N;i++)
				{
				zxSignal temp = cast<zxSignal>(Router.GetGameObject(tempsoup.GetNamedTag(i+"")));

				temp.protect_soup.Clear();
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