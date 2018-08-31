include "Signal.gs"
include "TrackMark.gs"
include "Browser.gs"
include "alsn_provider.gs"


class TrainContainer isclass GSObject
{
	public bool IsStopped;		// �������

	public int[] signal;		// ���������� ������������� ���������
	public int[] state;  		// 0 - ���������� � ���������, 1 - ���������� ������� ��������, 2 - ��������� �� ��������

	public bool HighSpeed;

};




class zxSpeedBoard isclass Trackside
{
	public float MainSpeed;		// �������� ����������� ���������

	public float ExtraSpeed;	// �������� ������������ ���������

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


class zxSignal isclass Signal, ALSN_Provider
{

	public define int ST_UNTYPED	= 1;		// ?
	public define int ST_IN		= 2;
	public define int ST_OUT	= 4;
	public define int ST_ROUTER	= 8;		// ����������, ���������� � �����, � ������(�����) ������

	public define int ST_UNLINKED	= 16;		// �� ��������� � ��������� �����
	public define int ST_PERMOPENED	= 32;		// ��������� �������� � ��������, ����. ���������
	public define int ST_SHUNT	= 64;		// ����������� �������� � �������� �������
	public define int ST_PROTECT	= 128;		// ��������������


	public int OwnId;		// �������������, ������ ��� �����

	public bool train_open;		// �������� ������ � �������� ������
	public bool shunt_open;		// �������� ������ � ���������� ������
	public bool wrong_dir;		// ������� ���������������� ��������
	public bool barrier_closed;	// �������������� ������

	public string stationName;
	public string privateName;


	public int MainState;		// ��������� ���������
	public int Type;		// ��� ���������

	public float speed_limit;	// ����������� ���������


	public bool MP_NotServer = false;	// �� �������� �������� � �������������� ���� (���������� ������)
	public bool IsServer = false;


	public bool[] ex_sgn;		// ���������� ���������
	public int ab4;			// 4-������� ��. -1 - �� ����������, 0 - ���, 1 - ����

	public zxSignal Cur_next;
	public zxSignal Cur_prev;

	public int[] TC_id = new int[0];

	public Browser mn = null;

	public int def_path_priority;	// ��������� ��������� � ��������� �� ���������


	public Soup span_soup;		// ���� ������������ ��������
	public Soup speed_soup;		// ���� ����������� ������

	public bool Inited=false;

	public zxSpeedBoard zxSP;
	public Trackside linkedMU;

	public string AttachedJunction;

	public bool train_is_l;

	public int code_freq;		// ������� ����������� ��� (0 - �� ����������)
	public int code_dev;		// ������ � ���� �� ����������, ���� ���������� (1 - ���������� � ���������, 2 - ���������� �� ���������, 3 - ������ �����������)


	public string ProtectGroup;
	public Soup protect_soup;

	public bool protect_influence;


	public void AddTrainId(int id)			// ���������� � �������� ��������� �������
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



	public void UpdateState(int reason, int priority)  	// ���������� ��������� ���������, �������� ����� ����������� ������
		{				// reason : 0 - ������� ��������� ��������� 1 - ����� ������ � ����������� 2 - ����� ������ � ����������� 3 - ����� ������ ������ 4 - ����� ������ ������ 5 - ��������� ���� ��������� �������
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

	public bool Switch_span()		// ��������� �������� � ������� ����� ���������
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
	public int MainState;		// ��������� ���������
	public float speed_limit;	// ����������� ���������
};


class zxMarker isclass Trackside
{


/*

trmrk_mod


0 ������ ����
1 ����������      - ���
2 ���������� �������
3 ������������ (���)
4 ��� (��)
5 ���
6 ������������ � 2-��������� ����������� (��)
7 ������ "���������������" ���� (��� ���)   - ���.
8 ����� ��
9 ������ �����������

*/


	public int trmrk_mod;
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
