include "Signal.gs"
include "TrackMark.gs"
include "Browser.gs"
include "alsn_provider.gs"


class TrainContainer isclass GSObject
{
	public bool IsStopped;		// стоящий

	public int[] signal;		// внутренний идентификатор светофора
	public int[] state;  		// 0 - подошедший к светофору, 1 - проехавший головой светофор, 2 - заехавший за светофор

	public bool HighSpeed;

};




class zxSpeedBoard isclass Trackside
{
	public float MainSpeed;		// скорость предыдущего светофора

	public float ExtraSpeed;	// скорость последующего светофора

	public void SetNewSpeed(float speed, bool extra)
		{
		if(speed == 0.0f)
			return;
			
		if(extra)
			ExtraSpeed=speed;
		else
			MainSpeed=speed;

		if(ExtraSpeed > MainSpeed)
			SetSpeedLimit( ExtraSpeed );
		else
			SetSpeedLimit( MainSpeed );
		}
};


class zxSignal isclass Signal, ALSN_Provider
{

	public define int ST_UNTYPED	= 1;		// ?
	public define int ST_IN		= 2;
	public define int ST_OUT	= 4;
	public define int ST_ROUTER	= 8;		// маршрутный, обладающий и синим, и зелёным(жёлтым) огнями

	public define int ST_UNLINKED	= 16;		// не состоящий в рельсовых цепях
	public define int ST_PERMOPENED	= 32;		// постоянно открытый в поездном, напр. проходной
	public define int ST_SHUNT	= 64;		// неспособный работать в поездном порядке
	public define int ST_PROTECT	= 128;		// заградительный


	public int OwnId;		// идентификатор, каждый раз новый

	public bool train_open;		// светофор открыт в поездном режиме
	public bool shunt_open;		// светофор открыт в маневровом режиме
	public bool wrong_dir;		// входной противонаправлен перегону
	public bool barrier_closed;	// заградительный закрыт

	public string stationName;
	public string privateName;


	public int MainState;		// состояние светофора
	public int Type;		// тип светофора

	public float speed_limit;	// ограничение светофора


	public bool MP_NotServer = false;	// не является сервером в мультиплеерной игре (отключение логики)
	public bool IsServer = false;


	public bool[] ex_sgn;		// допустимые показания
	public int ab4;			// 4-значная АБ. -1 - не определено, 0 - нет, 1 - есть

	public zxSignal Cur_next;
	public zxSignal Cur_prev;

	public int[] TC_id = new int[0];

	public Browser mn = null;

	public int def_path_priority;	// приоритет маршрутов к светофору по умолчанию


	public Soup span_soup;		// база построенного перегона
	public Soup speed_soup;		// база скоростного режима

	public bool Inited=false;

	public zxSpeedBoard zxSP;
	public Trackside linkedMU;

	public string AttachedJunction;

	public bool train_is_l;

	public int code_freq;		// частота кодирования АЛС (0 - не кодируется)
	public int code_dev;		// съезды к пути не кодируются, путь кодируется (1 - кодируются к светофору, 2 - кодируются от светофора, 3 - полное кодирование)


	public string ProtectGroup;
	public Soup protect_soup;

	public bool protect_influence;


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


	public void SetSignal(bool set_auto_state)
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


	public bool SetSpeedLim(float speed_limit_new)
		{
		if(speed_limit != speed_limit_new)
			speed_limit = speed_limit_new;
		else
			return false;


		if(zxSP)
			zxSP.SetNewSpeed(speed_limit, true);


		if(speed_limit > 0)
			{
			SetSpeedLimit( speed_limit );
			}
		else
			{
			SetSpeedLimit( -1 );
			}

		return true;
		}

	public bool IsObligatory()
		{
		if(!Inited)
			return true;

		if(MainState == 19)
			return false;

		if(protect_influence and barrier_closed)
			return true;


		if(Type & ST_UNLINKED)
			if(!train_open and !shunt_open and (Type & (ST_IN | ST_OUT)) )
				return true;
			else
				return false;
		return true;
		}


	public int FindTrainPrior(bool dir)
		{
		GSTrackSearch GSTS = BeginTrackSearch(dir);

		MapObject MO = GSTS.SearchNext();

		while(MO and !MO.isclass(Vehicle)  and !(MO.isclass(zxSignal) and  GSTS.GetFacingRelativeToSearchDirection() == dir  and !(((cast<zxSignal>MO).Type & zxSignal.ST_UNLINKED)   or ((cast<zxSignal>MO).MainState == 19) ) ) )
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


class zxSignal_Cache isclass GSObject
{
	public int MainState;		// состояние светофора
	public float speed_limit;	// ограничение светофора
};


class zxMarker isclass Trackside
{


/*


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


public int trmrk_mod;

*/


/*


0 прямой путь
1 отклонение
2 отклонение пологое
4 нет сковозного пропуска
8 неправильный
16 ПАБ (ЗЗ)
32 АЛС
64 неправильного с двух сторонней АБ
128 маркер "располовиненого" пути (для ЖЖЖ)
256 конец АБ
512 нет 4-значной АБ
1024 маркер направления


*/

	public define int MRFT		= 0;
	public define int MRT		= 1;
	public define int MRT18		= 2;
	public define int MRNOPR		= 4;
	public define int MRWW		= 8;
	public define int MRPAB		= 16;
	public define int MRALS		= 32;
	public define int MRDAB		= 64;
	public define int MRHALFBL	= 128;
	public define int MRENDAB	= 256;
	public define int MREND4AB	= 512;
	public define int MRN		= 1024;

	public int trmrk_flag;

	public string info;

};





class zxExtraLink isclass GSObject
{
	public void UpdateSignalState(zxSignal zxsign, int NewState, int priority)
		{
		}
};




class zxSignalLink isclass GSObject
{
	public zxSignal sign;
};
