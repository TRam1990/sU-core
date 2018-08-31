include "Signal.gs"
include "TrackMark.gs"
include "Browser.gs"


class TrainContainer isclass GSObject
{
	public bool IsStopped;		// стоящий

	public int[] signal;		// внутренний идентификатор светофора
	public int[] state;  		// 0 - подошедший к светофору, 1 - проехавший головой светофор, 2 - заехавший за светофор
};




class zxSpeedBoard isclass Trackside
{
	public float MainSpeed;		// скорость предыдущего светофора

	public float ExtraSpeed;	// скорость последующего светофора
	
	public void SetNewSpeed(float speed, bool extra)
		{
		if(extra)
			ExtraSpeed=speed;
		else
			MainSpeed=speed;

		if(ExtraSpeed > MainSpeed)
			SetSpeedLimit( ExtraSpeed );
		else
			SetSpeedLimit( -1 );
		}
};


class zxSignal isclass Signal
{

	public define int ST_UNTYPED	= 1;		// ?
	public define int ST_IN		= 2;
	public define int ST_OUT	= 4;
	public define int ST_ROUTER	= 8;		// маршрутный, обладающий и синим, и зелёным(жёлтым) огнями

	public define int ST_UNLINKED	= 16;		// не состоящий в рельсовых цепях
	public define int ST_PERMOPENED	= 32;		// постоянно открытый в поездном, напр. проходной
	public define int ST_SHUNT	= 64;		// неспособный работать в поездном порядке
	public define int ST_ZAGRAD	= 144;		// 16 + 128, заградительный 
	


	public int OwnId;		// идентификатор, каждый раз новый


	public bool train_open;		// светофор открыт в поездном режиме
	public bool shunt_open;		// светофор открыт в маневровом режиме


	public string stationName;
	public string privateName;


	public int MainState;		// состояние светофора
	public int Type;		// тип светофора

	public bool[] ex_sgn;		// допустимые показания
	public int ab4;			// 4-значная АБ. -1 - не определено, 0 - нет, 1 - есть

	public zxSignal Cur_next;
	public zxSignal Cur_next_extra;
	public zxSignal Cur_prev;
	public zxSignal Cur_prev_extra;

	public int[] TC_id = new int[0];

	public Browser mn = null;

	public bool wrong_dir;

	public float speed_limit;

	public int def_path_priority;	// приоритет маршрутов к светофору по умолчанию


	public Soup span_soup;		// база построенного перегона
	public Soup speed_soup;		// база скоростного режима

	public bool Inited=false;

	public zxSpeedBoard zxSP;
	public Trackside linkedMU;

	public bool train_is_l;

	public int code_freq;		// частота кодирования АЛС (0 - не кодируется)
	public bool code_dev;		// съезды к пути не кодируются, путь кодируется


	public void AddTrainId(int id)			// добавление и удаление наехавших поездов
		{
		int i;
		bool exist=false;
		for(i=0;i<TC_id.size();i++)
			{
			if(TC_id[i]==id)
				exist=true;
			}
		if(exist)
			return;

		
		TC_id[TC_id.size(),TC_id.size()+1]=new int[1];
		TC_id[TC_id.size()-1]=id;
		}

	
	public void RemoveTrainId(int id)
		{
		int i=0;
		int n=-1;
		while(i<TC_id.size() and n<0)
			{
			if(TC_id[i]==id)
				n=i;
			i++;
			}
		if(n<0)
			return;

		
		TC_id[n,n+1]=null;
		}



	public void UpdateState(int reason, int priority)  	// обновление состояния светофора, основной кусок сигнального движка
		{				// reason : 0 - команда изменения состояния 1 - наезд поезда в направлении 2 - съезд поезда в направлении 3 - наезд поезда против 4 - съезд поезда против 5 - покидание зоны светофора поездом 
 		//Interface.Print("!!! signal "+privateName+"@"+stationName+" changed for "+reason+ " priority "+priority);


		}

	public void UnlinkedUpdate(int mainstate)
		{
		}



	public void CheckPrevSignals(bool no_train)
		{	
		}


	public void SetSignal()
		{
		}

	public bool Switch_span()		// повернуть светофор в сторону этого светофора
		{
		return false;
		}


	public float GetSpeedLim(int prior)
		{
		if(MainState == 19)
			return -1.0;

		string s=MainState;

		if(prior==1)
			s="p"+s;
		else
			s="c"+s;

		if(!speed_soup)
			{
			Interface.Exception("Error with signal "+GetName());
			}

		return (speed_soup.GetNamedTagAsInt(s)/3.6);
		}


	public float SetSpeedLim(int prior)
		{
		speed_limit = GetSpeedLim(prior);

		if(zxSP)
			zxSP.SetNewSpeed(speed_limit, true);

		if((speed_limit > 0) and (GetSpeedLimit() != speed_limit))
			SetSpeedLimit( speed_limit );

		if((speed_limit == 0) and (GetSpeedLimit() > 0))
			SetSpeedLimit( -1 );

		return speed_limit;
		}


	public int FindTrainPrior(bool dir)
		{
		GSTrackSearch GSTS = BeginTrackSearch(dir);
	
		MapObject MO = GSTS.SearchNext();
	
		while(MO and !MO.isclass(Vehicle)  and !(MO.isclass(zxSignal) and  GSTS.GetFacingRelativeToSearchDirection() == dir  and !((cast<zxSignal>MO).Type & zxSignal.ST_UNLINKED) ) )
			MO = GSTS.SearchNext();

		if(!MO or !MO.isclass(Vehicle))
			{
			return 2;
			}


		Train tr1 = (cast<Vehicle>MO).GetMyTrain();
		if(!tr1)
			{
			Interface.Exception("Train with "+MO.GetName()+"contains a vehicle with error, delete it");
			return 2;
			}
		if(tr1.GetTrainPriorityNumber() == 1)
			return 1;
			
		return 2;
		}

	public void SetzxSpeedBoard(MapObject newSP)
		{
		}

	public void SetLinkedMU(Trackside MU)
		{
		}


};


class zxMarker isclass Trackside
{


/*

trmrk_mod 


0 прямой путь
1 отклонение      - доп
2 отклонение пологое
3 неправильное (ЖмБ)
4 ПАБ (ЗЗ)
5 АЛС
6 неправильное с 2-сторонней блокировкой (ЗЗ)
7 маркер "располовиненого" пути (для ЖЖЖ)   - доп.
8 конец АБ
9 маркер направления

*/


	public int trmrk_mod;
	public string info;

};










class zxSignalLink isclass GSObject
{
	public zxSignal sign;
};
