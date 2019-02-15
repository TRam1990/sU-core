include "Signal.gs"
include "TrackMark.gs"
include "Browser.gs"
include "alsn_provider.gs"


class TrainContainer isclass GSObject
{
	public bool IsStopped;		// ñòîÿùèé

	public int[] signal;		// âíóòðåííèé èäåíòèôèêàòîð ñâåòîôîðà
	public int[] state;  		// 0 - ïîäîøåäøèé ê ñâåòîôîðó, 1 - ïðîåõàâøèé ãîëîâîé ñâåòîôîð, 2 - çàåõàâøèé çà ñâåòîôîð

	public bool HighSpeed;

};




class zxSpeedBoard isclass Trackside
{
	public float MainSpeed;		// ñêîðîñòü ïðåäûäóùåãî ñâåòîôîðà
	public float ExtraSpeed;	// ñêîðîñòü ïîñëåäóþùåãî ñâåòîôîðà




	public bool SetNewSpeed(float speed, bool extra)
		{
		if(speed == 0.0f)
			{
			if(ExtraSpeed > MainSpeed)
				SetSpeedLimit( ExtraSpeed );
			else
				SetSpeedLimit( MainSpeed );

			return false;
			}
			
		if(extra)
			ExtraSpeed=speed;
		else
			MainSpeed=speed;

		if(ExtraSpeed > MainSpeed)
			{
			SetSpeedLimit( ExtraSpeed );
			if(extra)
				return true;
			}
		else
			{
			SetSpeedLimit( MainSpeed );
			if(!extra)
				return true;
			}
		return false;
		}
};


class zxSpeedLimit isclass Trackside
{
	public float max_speed_pass;	// óñòàíîâëåííîå îãðàíè÷åíèå ïàññàæèðñêèì
	public float max_speed_cargo;	// óñòàíîâëåííîå îãðàíè÷åíèå ãðóçîâûì

	public bool is_limit_start = false;	// ÿâëÿåòñÿ íà÷àëîì/îêîí÷àíèåì îãðàíè÷åíèÿ

	public void SetLimitFor(float speed, bool pass)
		{
		if(speed == 0.0f)
			{
			if(pass)
				SetSpeedLimit( max_speed_pass );
			else
				SetSpeedLimit( max_speed_cargo );
			return;
			}

		if(!is_limit_start)
			{
			SetSpeedLimit( speed );
			return;
			}	
			
		if(pass)
			{
			if(speed > max_speed_pass)
				SetSpeedLimit( max_speed_pass );
			else
				SetSpeedLimit( speed );
			}
		else
			{
			if(speed > max_speed_cargo)
				SetSpeedLimit( max_speed_cargo );
			else
				SetSpeedLimit( speed );
			}
		}
};


class zxSignal isclass Signal, ALSN_Provider
{

	public define int ST_UNTYPED	= 1;		// ?
	public define int ST_IN		= 2;
	public define int ST_OUT	= 4;
	public define int ST_ROUTER	= 8;		// ìàðøðóòíûé, îáëàäàþùèé è ñèíèì, è çåë¸íûì(æ¸ëòûì) îãíÿìè

	public define int ST_UNLINKED	= 16;		// íå ñîñòîÿùèé â ðåëüñîâûõ öåïÿõ
	public define int ST_PERMOPENED	= 32;		// ïîñòîÿííî îòêðûòûé â ïîåçäíîì, íàïð. ïðîõîäíîé
	public define int ST_SHUNT	= 64;		// íåñïîñîáíûé ðàáîòàòü â ïîåçäíîì ïîðÿäêå
	public define int ST_PROTECT	= 128;		// çàãðàäèòåëüíûé


	public int OwnId;		// èäåíòèôèêàòîð, êàæäûé ðàç íîâûé

	public bool train_open;		// ñâåòîôîð îòêðûò â ïîåçäíîì ðåæèìå
	public bool shunt_open;		// ñâåòîôîð îòêðûò â ìàíåâðîâîì ðåæèìå
	public bool wrong_dir;		// âõîäíîé ïðîòèâîíàïðàâëåí ïåðåãîíó
	public bool barrier_closed;	// çàãðàäèòåëüíûé çàêðûò

	public string stationName;
	public string privateName;


	public int MainState;		// ñîñòîÿíèå ñâåòîôîðà
	public int Type;		// òèï ñâåòîôîðà

	public float speed_limit;	// îãðàíè÷åíèå ñâåòîôîðà

	public float max_speed_pass = 0;	// óñòàíîâëåííîå îãðàíè÷åíèå ïàññàæèðñêèì ( 0 - íåò îãðàíè÷åíèé)
	public float max_speed_cargo = 0;	// óñòàíîâëåííîå îãðàíè÷åíèå ãðóçîâûì ( 0 - íåò îãðàíè÷åíèé)

	public bool MP_NotServer = false;	// íå ÿâëÿåòñÿ ñåðâåðîì â ìóëüòèïëååðíîé èãðå (îòêëþ÷åíèå ëîãèêè)
	public bool IsServer = false;


	public bool[] ex_sgn;		// äîïóñòèìûå ïîêàçàíèÿ
	public int ab4;			// 4-çíà÷íàÿ ÀÁ. -1 - íå îïðåäåëåíî, 0 - íåò, 1 - åñòü

	public zxSignal Cur_next;
	public zxSignal Cur_prev;

	public int[] TC_id = new int[0];

	public Browser mn = null;

	public int def_path_priority;	// ïðèîðèòåò ìàðøðóòîâ ê ñâåòîôîðó ïî óìîë÷àíèþ


	public Soup span_soup;		// áàçà ïîñòðîåííîãî ïåðåãîíà
	public Soup speed_soup;		// áàçà ñêîðîñòíîãî ðåæèìà

	public bool Inited=false;

	public zxSpeedBoard zxSP;
	public Trackside linkedMU;

	public string AttachedJunction;

	public bool train_is_l;

	public int code_freq;		// ÷àñòîòà êîäèðîâàíèÿ ÀËÑ (0 - íå êîäèðóåòñÿ)
	public int code_dev;		// ñúåçäû ê ïóòè íå êîäèðóþòñÿ, ïóòü êîäèðóåòñÿ (1 - êîäèðóþòñÿ ê ñâåòîôîðó, 2 - êîäèðóþòñÿ îò ñâåòîôîðà, 3 - ïîëíîå êîäèðîâàíèå)


	public string ProtectGroup;
	public Soup protect_soup;

	public bool protect_influence;


	public void AddTrainId(int id)			// äîáàâëåíèå è óäàëåíèå íàåõàâøèõ ïîåçäîâ
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



	public void UpdateState(int reason, int priority)  	// îáíîâëåíèå ñîñòîÿíèÿ ñâåòîôîðà, îñíîâíîé êóñîê ñèãíàëüíîãî äâèæêà
		{				// reason : 0 - êîìàíäà èçìåíåíèÿ ñîñòîÿíèÿ 1 - íàåçä ïîåçäà â íàïðàâëåíèè 2 - ñúåçä ïîåçäà â íàïðàâëåíèè 3 - íàåçä ïîåçäà ïðîòèâ 4 - ñúåçä ïîåçäà ïðîòèâ 5 - ïîêèäàíèå çîíû ñâåòîôîðà ïîåçäîì
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

	public bool Switch_span(bool obligatory)		// ïîâåðíóòü ñâåòîôîð â ñòîðîíó ýòîãî ñâåòîôîðà
		{
		return false;
		}

	public bool Switch_span()		// îñòàâëåíî äëÿ ñîâìåñòèìîñòè
		{
		return Switch_span(false);
		}

	public float GetCurrSpeedLim(float SpeedLim, int prior)
		{
		if(SpeedLim <= 0)
			return SpeedLim;
			
		if(prior==1)
			{
			if(max_speed_pass > 0 and max_speed_pass < SpeedLim )
				return max_speed_pass;
			}
		else
			{
			if(max_speed_cargo > 0 and max_speed_cargo < SpeedLim)
				return max_speed_cargo;
			}

		return SpeedLim;
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
		if(zxSP and speed_limit_new != zxSP.ExtraSpeed)
			zxSP.SetNewSpeed(speed_limit_new, true);

		if(speed_limit != speed_limit_new)
			speed_limit = speed_limit_new;
		else
			return false;	

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
	public int MainState;		// ñîñòîÿíèå ñâåòîôîðà
	public float speed_limit;	// îãðàíè÷åíèå ñâåòîôîðà
};


class zxMarker isclass Trackside
{


/*


0 ïðÿìîé ïóòü
1 îòêëîíåíèå      - äîï
2 îòêëîíåíèå ïîëîãîå
3 íåïðàâèëüíîå (ÆìÁ)
4 ÏÀÁ (ÇÇ)
5 ÀËÑ
6 íåïðàâèëüíîå ñ 2-ñòîðîííåé áëîêèðîâêîé (ÇÇ)
7 ìàðêåð "ðàñïîëîâèíåíîãî" ïóòè (äëÿ ÆÆÆ)   - äîï.
8 êîíåö ÀÁ
9 ìàðêåð íàïðàâëåíèÿ
10 ìàðêåð âêëþ÷åíèÿ Ç ïåðåä Æì íà 4ÀÁ
11 ìàðêåð îòñóòñòâèÿ êîíòðîëÿ çàíÿòîñòè ïåðåãîíà


public int trmrk_mod;

*/


/*


0 ïðÿìîé ïóòü
1 îòêëîíåíèå
2 îòêëîíåíèå ïîëîãîå
4 íåò ñêîâîçíîãî ïðîïóñêà
8 íåïðàâèëüíûé
16 ÏÀÁ (ÇÇ)
32 ÀËÑ
64 íåïðàâèëüíîãî ñ äâóõ ñòîðîííåé ÀÁ
128 ìàðêåð "ðàñïîëîâèíåíîãî" ïóòè (äëÿ ÆÆÆ)
256 êîíåö ÀÁ
512 íåò 4-çíà÷íîé ÀÁ
1024 ìàðêåð íàïðàâëåíèÿ
2048 ìàðêåð çåë¸íîãî íà 4ÀÁ ïåðåä Æìèã/Çìèã
4096 ìàðêåð êîíöà êîíòðîëèðóåìîãî ó÷àñòêà

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
