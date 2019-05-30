include "Signal.gs"
include "alsn_provider.gs"
include "Trigger.gs"
include "TrackMark.gs"
include "Browser.gs"
include "zx_indication.gs"


class TrainContainer isclass GSObject
{
	public bool IsStopped;		// стоящий

	public int[] signal;		// внутренний идентификатор светофора
	public int[] state;  		// 0 - подошедший к светофору, 1 - проехавший головой светофор, 2 - заехавший за светофор
	public bool HighSpeed;


	public int[] speed_object;

};


class zxSpeedObject isclass Trigger
{
	public float max_speed_pass;	// установленное ограничение пассажирским
	public float max_speed_cargo;	// установленное ограничение грузовым

	public int OwnId;		// идентификатор, каждый раз новый
};



class zxSpeedBoard isclass zxSpeedObject
{
	public int last_prior = 2;


	public float prev_speed_pass;		// задаются при открытии предыдущего светофора
	public float prev_speed_cargo;


	public float next_speed_pass;		// задаются присоединённым светофором
	public float next_speed_cargo;

	public void UpdateSpeedboard(bool set_limit)
		{
		}
};


class zxSpeedLimit isclass zxSpeedObject
{

	public bool is_limit_start = false;	// является началом/окончанием ограничения

	// если является окончанием, то max_speed_pass/max_speed_cargo задаётся из предыдущего светофора

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
	public bool prigl_open;		// открыт пригласительный

	public string stationName;
	public string privateName;


	public int MainState;		// состояние светофора
	public int Type;		// тип светофора

	public float speed_limit;	// ограничение светофора

	public float max_speed_pass = 0;	// установленное ограничение пассажирским ( 0 - нет ограничений)
	public float max_speed_cargo = 0;	// установленное ограничение грузовым ( 0 - нет ограничений)


	public bool out_speed_set = false;	// ограничение, устанавливаемое внешними объектами
	public float out_speed_pass = 0;	
	public float out_speed_cargo = 0;	



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
		int old_id_size = TC_id.size();
		for(i=0;i<old_id_size;i++)
			{
			if(TC_id[i]==id)
				exist=true;
			}
		if(exist)
			return;

		TC_id[old_id_size,old_id_size]=new int[1];
		TC_id[old_id_size]=id;
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

	public bool Switch_span(bool obligatory)		// повернуть светофор в сторону этого светофора
		{
		return false;
		}

	public bool Switch_span()		// оставлено для совместимости
		{
		return Switch_span(false);
		}


	public void SetMainStateSpeedLim()
		{
		if((Type & ST_UNLINKED) or 
		   (MainState == zxIndication.STATE_B) or 
                   (barrier_closed and Type & ST_PROTECT))	// принципиально не могут получать показания
			{
			max_speed_pass = 0;
			max_speed_cargo = 0;
			return;
			}

		if(!speed_soup)
			{
			Interface.Exception("Error with signal "+GetName());
			}


		string s=MainState;


		float tmp_max_speed_pass = speed_soup.GetNamedTagAsInt("p"+s)/3.6;
		float tmp_max_speed_cargo = speed_soup.GetNamedTagAsInt("c"+s)/3.6;

		
		if(tmp_max_speed_pass > 0)
			max_speed_pass = tmp_max_speed_pass;

		if(tmp_max_speed_cargo > 0)
			max_speed_cargo = tmp_max_speed_cargo;


		if(zxSP)
			{
			if((tmp_max_speed_pass != zxSP.next_speed_pass) or
			   (tmp_max_speed_cargo != zxSP.next_speed_cargo))
				{
				zxSP.next_speed_pass = tmp_max_speed_pass;
				zxSP.next_speed_cargo = tmp_max_speed_cargo;

				zxSP.UpdateSpeedboard(true);
				}
			}
		}


	public bool IsObligatory()
		{
		if(!Inited)
			return true;

		if(MainState == zxIndication.STATE_B)
			return false;


		if(Type & ST_UNLINKED)
			{
			if(!train_open and !shunt_open and (Type & (ST_IN | ST_OUT)) )
				return true;
			else
				return false;
			}
		return true;
		}

	public bool ToggleBlinker()		// обработчик переключения при мигании
		{
		return false;
		}


	public int FindTrainPrior(bool dir)
		{
		GSTrackSearch GSTS = BeginTrackSearch(dir);

		MapObject MO = GSTS.SearchNext();

		while(MO and !MO.isclass(Vehicle)  and !(MO.isclass(zxSignal) and  GSTS.GetFacingRelativeToSearchDirection() == dir  and !(((cast<zxSignal>MO).Type & zxSignal.ST_UNLINKED) or ((cast<zxSignal>MO).MainState == zxIndication.STATE_B) ) ) )
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




	public bool ApplyNewSpeedLimit(int prority)
		{
		float result_speed;

		float tmp_speed_pass = max_speed_pass;
		float tmp_speed_cargo = max_speed_cargo;

		if(out_speed_set)
			{		// поиск минимальной скорости

			if(out_speed_pass < max_speed_pass)
				tmp_speed_pass = out_speed_pass;

			if(out_speed_cargo < max_speed_cargo)
				tmp_speed_cargo = out_speed_cargo;

			}

		if(tmp_speed_pass == tmp_speed_cargo)	// наибольший не важен
			result_speed = tmp_speed_cargo;
		else
			{
			if(prority < 1)
				prority = FindTrainPrior(false);
				
			if(prority == 1)
				result_speed = tmp_speed_pass;
			else
				result_speed = tmp_speed_cargo;
			}

		if(result_speed != GetSpeedLimit())
			{
			if(result_speed > 0)
				speed_limit = result_speed;
			SetSpeedLimit( result_speed );
			return true;
			}
		return false;
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
10 маркер включения З перед Жм на 4АБ
11 маркер отсутствия контроля занятости перегона


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
2048 маркер зелёного на 4АБ перед Жмиг/Змиг
4096 маркер конца контролируемого участка

*/

	public define int MRFT		= 0;
	public define int MRT		= 1;
	public define int MRT18		= 2;
	public define int MRNOPR	= 4;
	public define int MRWW		= 8;
	public define int MRPAB		= 16;
	public define int MRALS		= 32;
	public define int MRDAB		= 64;
	public define int MRHALFBL	= 128;
	public define int MRENDAB	= 256;
	public define int MREND4AB	= 512;
	public define int MRN		= 1024;
	public define int MRGR4ABFL	= 2048;
	public define int MRENDCONTROL	= 4096;

	public int trmrk_flag;

	public string info;

};




class zxExtraLinkBase
{
	public void UpdateSignalState(zxSignal zxsign, int NewState, int priority)
		{
		}
};



class zxExtraLink isclass GSObject, zxExtraLinkBase
{
};


class zxExtraLinkContainer isclass GSObject
{
	public zxExtraLinkBase extra_link;
};





class zxSignalLink isclass GSObject
{
	public zxSignal sign;
};
