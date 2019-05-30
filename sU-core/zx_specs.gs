include "Signal.gs"
include "alsn_provider.gs"
include "Trigger.gs"
include "TrackMark.gs"
include "Browser.gs"
include "zx_indication.gs"


class TrainContainer isclass GSObject
{
	public bool IsStopped;		// �������

	public int[] signal;		// ���������� ������������� ���������
	public int[] state;  		// 0 - ���������� � ���������, 1 - ���������� ������� ��������, 2 - ��������� �� ��������
	public bool HighSpeed;


	public int[] speed_object;

};


class zxSpeedObject isclass Trigger
{
	public float max_speed_pass;	// ������������� ����������� ������������
	public float max_speed_cargo;	// ������������� ����������� ��������

	public int OwnId;		// �������������, ������ ��� �����
};



class zxSpeedBoard isclass zxSpeedObject
{
	public int last_prior = 2;


	public float prev_speed_pass;		// �������� ��� �������� ����������� ���������
	public float prev_speed_cargo;


	public float next_speed_pass;		// �������� ������������� ����������
	public float next_speed_cargo;

	public void UpdateSpeedboard(bool set_limit)
		{
		}
};


class zxSpeedLimit isclass zxSpeedObject
{

	public bool is_limit_start = false;	// �������� �������/���������� �����������

	// ���� �������� ����������, �� max_speed_pass/max_speed_cargo ������� �� ����������� ���������

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
	public bool prigl_open;		// ������ ���������������

	public string stationName;
	public string privateName;


	public int MainState;		// ��������� ���������
	public int Type;		// ��� ���������

	public float speed_limit;	// ����������� ���������

	public float max_speed_pass = 0;	// ������������� ����������� ������������ ( 0 - ��� �����������)
	public float max_speed_cargo = 0;	// ������������� ����������� �������� ( 0 - ��� �����������)


	public bool out_speed_set = false;	// �����������, ��������������� �������� ���������
	public float out_speed_pass = 0;	
	public float out_speed_cargo = 0;	



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

	public bool Switch_span(bool obligatory)		// ��������� �������� � ������� ����� ���������
		{
		return false;
		}

	public bool Switch_span()		// ��������� ��� �������������
		{
		return Switch_span(false);
		}


	public void SetMainStateSpeedLim()
		{
		if((Type & ST_UNLINKED) or 
		   (MainState == zxIndication.STATE_B) or 
                   (barrier_closed and Type & ST_PROTECT))	// ������������� �� ����� �������� ���������
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

	public bool ToggleBlinker()		// ���������� ������������ ��� �������
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
			{		// ����� ����������� ��������

			if(out_speed_pass < max_speed_pass)
				tmp_speed_pass = out_speed_pass;

			if(out_speed_cargo < max_speed_cargo)
				tmp_speed_cargo = out_speed_cargo;

			}

		if(tmp_speed_pass == tmp_speed_cargo)	// ���������� �� �����
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
	public int MainState;		// ��������� ���������
	public float speed_limit;	// ����������� ���������
};


class zxMarker isclass Trackside
{


/*

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
10 ������ ��������� � ����� �� �� 4��
11 ������ ���������� �������� ��������� ��������


public int trmrk_mod;

*/


/*

0 ������ ����
1 ����������
2 ���������� �������
4 ��� ���������� ��������
8 ������������
16 ��� (��)
32 ���
64 ������������� � ���� ��������� ��
128 ������ "���������������" ���� (��� ���)
256 ����� ��
512 ��� 4-������� ��
1024 ������ �����������
2048 ������ ������� �� 4�� ����� ����/����
4096 ������ ����� ��������������� �������

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
