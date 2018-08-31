include "zx_specs.gs"


class zxIndication isclass GSObject
{
public string name;

public int MainState;
public int ind_num;


public void Init()
	{
	name="_";
	}
	
	
public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	int i;
	for(i=0;i<10;i++)
		{
		used_lens[i] = false;
		blink_lens[i] = false;
		}
	}
};



class bb_R isclass zxIndication
{

public void Init()
	{
	inherited();
	ind_num=1;
	MainState=0;
	name="R";
	}


public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);
	used_lens[0]=true;
	}

};


class bb_Rx isclass zxIndication
{

public void Init()
	{
	inherited();
	ind_num=2;
	MainState=1000;
	name="X";
	}

public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);
	}

};


class bb_RWb isclass zxIndication
{
public int white_lens; // 0 - �����������, 1 - "����������", 2 - ��������

public void Init()
	{
	inherited();
	ind_num=3;
	MainState=1;
	name="RWb";
	white_lens = 2;
	}

public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);
	used_lens[0]=true;

	switch(white_lens)
		{
		case 0:
			break;
		case 1:
			used_lens[6]=true;		// �����, ������������� ��������
			blink_lens[6]=true;
			break;

		case 2:
		default:
			used_lens[7]=true;		// �����, ������������� ��������
			blink_lens[7]=true;
		}
	}

};




class bb_YY isclass zxIndication
{

public void Init()
	{
	inherited();
	ind_num=4;
	MainState=2;
	name="YY";
	}

public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);
	used_lens[3]=true;
	used_lens[4]=true;
	}

};



class bb_YYL isclass zxIndication
{

public void Init()
	{
	inherited();
	ind_num=5;
	MainState=3;
	name="YYL";
	}


public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[3]=true;
	used_lens[4]=true;
	used_lens[9]=true;
	}

};



class bb_Y isclass zxIndication
{

public void Init()
	{
	inherited();
	ind_num=6;
	MainState=4;
	name="Y";
	}

public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);
	used_lens[3]=true;
	}

};



class bb_YbY isclass zxIndication
{

public void Init()
	{
	inherited();
	ind_num=7;
	MainState=5;
	name="YbY";
	}


public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[3]=true;
	used_lens[4]=true;

	blink_lens[3]=true;
	}

};



class bb_YbYL isclass zxIndication
{

public void Init()
	{
	inherited();
	ind_num=8;
	MainState=6;
	name="YbYL";
	}


public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[3]=true;
	used_lens[4]=true;
	used_lens[9]=true;

	blink_lens[3]=true;
	}

};



class bb_GY isclass zxIndication
{

public void Init()
	{
	inherited();
	ind_num=9;
	MainState=7;
	name="GY";
	}

public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[1]=true;
	used_lens[3]=true;
	}

};


class bb_Gb isclass zxIndication
{

public void Init()
	{
	inherited();
	ind_num=10;
	MainState=8;
	name="Gb";
	}


public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[1]=true;
	
	blink_lens[1]=true;

	}

};



class bb_Yb isclass zxIndication
{


public void Init()
	{
	inherited();
	ind_num=11;
	MainState=9;
	name="Yb";
	}


public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[3]=true;
	
	blink_lens[3]=true;
	}

};


class bb_GbYL isclass zxIndication
{


public void Init()
	{
	inherited();
	ind_num=12;
	MainState=10;
	name="GbYL";
	}


public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[1]=true;
	used_lens[4]=true;
	used_lens[9]=true;
	
	blink_lens[1]=true;
	}

};



class bb_YYY isclass zxIndication
{



public void Init()
	{
	inherited();
	ind_num=13;
	MainState=11;
	name="YYY";
	}

public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[3]=true;
	used_lens[4]=true;
	used_lens[5]=true;
	}

};




class bb_G isclass zxIndication
{


public void Init()
	{
	inherited();
	ind_num=14;
	MainState=12;
	name="G";
	}


public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[1]=true;
	}

};



class bb_GG isclass zxIndication
{


public void Init()
	{
	inherited();
	ind_num=15;
	MainState=27;
	name="GG";
	}


public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[1]=true;
	used_lens[2]=true;
	}

};



class bb_YW isclass zxIndication
{


public void Init()
	{
	inherited();
	ind_num=16;
	MainState=34;
	name="YW";
	}


public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[3]=true;
	used_lens[6]=true;
	}

};


class bb_GW isclass zxIndication
{



public void Init()
	{
	inherited();
	ind_num=17;
	MainState=37;
	name="GW";
	}

public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[1]=true;
	used_lens[6]=true;
	}

};


class bb_YbW isclass zxIndication
{

public void Init()
	{
	inherited();
	ind_num=18;
	MainState=34;
	name="YbW";
	}


public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);
	used_lens[3]=true;
	used_lens[6]=true;

	blink_lens[3]=true;
	}

};


class bb_B isclass zxIndication
{


public void Init()
	{
	inherited();
	ind_num=19;
	MainState=100;
	name="B";
	}

public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[8]=true;
	}

};



class bb_W isclass zxIndication
{


public void Init()
	{
	inherited();
	ind_num=20;
	MainState=101;
	name="W";
	}

public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[6]=true;
	}

};


class bb_WW isclass zxIndication
{


public void Init()
	{
	inherited();
	ind_num=21;
	MainState=102;
	name="WW";
	}

public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[6]=true;
	used_lens[7]=true;
	}

};




class bb_YYW isclass zxIndication
{


public void Init()
	{
	inherited();
	ind_num=22;
	MainState=35;
	name="YYW";
	}


public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[3]=true;
	used_lens[4]=true;
	used_lens[6]=true;
	}

};



class bb_YbYW isclass zxIndication
{


public void Init()
	{
	inherited();
	ind_num=23;
	MainState=36;
	name="YbYW";
	}


public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[3]=true;
	used_lens[4]=true;
	used_lens[6]=true;

	blink_lens[3]=true;
	}

};




class bb_YYWL isclass zxIndication
{


public void Init()
	{
	inherited();
	ind_num=24;
	MainState=3;
	name="YYWL";
	}


public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[3]=true;
	used_lens[4]=true;
	used_lens[6]=true;
	used_lens[9]=true;
	}

};


class bb_GbYWL isclass zxIndication
{


public void Init()
	{
	inherited();
	ind_num=25;
	MainState=10;
	name="GbYWL";
	}


public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);

	used_lens[1]=true;
	used_lens[4]=true;
	used_lens[6]=true;
	used_lens[9]=true;
	
	blink_lens[1]=true;
	}

};






class zxIndLink isclass GSObject
{
	public zxIndication l;

};




static class zxLightContainer
{

public define string lens = "RGGYYYWWBL";	// ������� ������ ����� ����� ����� ������_������

public zxIndLink[] sgn_st;

zxIndication nosign;
bb_R R;
bb_Rx Rx;
bb_RWb RWb;
bb_YY YY;
bb_YYL YYL;
bb_Y Y;
bb_YbY YbY;
bb_YbYL YbYL;
bb_GY GY;
bb_Gb Gb;
bb_Yb Yb;
bb_GbYL GbYL;
bb_YYY YYY;
bb_G G;
bb_GG GG;
bb_YW YW;
bb_GW GW;
bb_YbW YbW;
bb_B B;
bb_W W;
bb_WW WW;
bb_YYW YYW;
bb_YbYW YbYW;
bb_YYWL YYWL;
bb_GbYWL GbYWL;




public void Init()
	{

	nosign = new zxIndication();
	R = new bb_R();
	Rx = new bb_Rx();
	RWb = new bb_RWb();
	YY = new bb_YY();
	YYL = new bb_YYL();
	Y = new bb_Y();
	YbY = new bb_YbY();
	YbYL = new bb_YbYL();
	GY = new bb_GY();
	Gb = new bb_Gb();
	Yb = new bb_Yb();
	GbYL = new bb_GbYL();
	YYY = new bb_YYY();
	G = new bb_G();
	GG = new bb_GG();
	YW = new bb_YW();
	GW = new bb_GW();
	YbW = new bb_YbW();
	B = new bb_B();
	W = new bb_W();
	WW = new bb_WW();
	YYW = new bb_YYW();
	YbYW = new bb_YbYW();
	YYWL = new bb_YYWL();
	GbYWL = new bb_GbYWL();


	sgn_st = new zxIndLink[26];
	int i;

	for(i=0;i<26;i++)
		sgn_st[i] = new zxIndLink();


	sgn_st[0].l = nosign;	
	sgn_st[1].l = R;	
	sgn_st[2].l = Rx;	
	sgn_st[3].l = RWb;	
	sgn_st[4].l = YY;	
	sgn_st[5].l = YYL;	
	sgn_st[6].l = Y;
	sgn_st[7].l = YbY;	
	sgn_st[8].l = YbYL;
	sgn_st[9].l = GY;
	sgn_st[10].l = Gb;
	sgn_st[11].l = Yb;
	sgn_st[12].l = GbYL;
	sgn_st[13].l = YYY;	
	sgn_st[14].l = G;
	sgn_st[15].l = GG;
	sgn_st[16].l = YW;
	sgn_st[17].l = GW;
	sgn_st[18].l = YbW;
	sgn_st[19].l = B;
	sgn_st[20].l = W;
	sgn_st[21].l = WW;
	sgn_st[22].l = YYW;
	sgn_st[23].l = YbYW;
	sgn_st[24].l = YYWL;
	sgn_st[25].l = GbYWL;

	for(i=0;i<26;i++)
		sgn_st[i].l.Init();

	}


public int FindPossibleSgn(bool[] possible_sgn, bool[] ex_lens)		// �-�� - ����� ����� - 0 - �����������, 1 - "����������", 2 - ��������
	{
	int i;
	bool[] Temp_st= new bool[10];
	bool[] Temp_2= new bool[10];

	int result_kbm = 0;

	for(i=0;i<26;i++)
		{
		sgn_st[i].l.InitIndif(Temp_st, Temp_2);
		bool possible = true;
		int j;
		
		for(j=0;j<10;j++)
			if(Temp_st[j] and !ex_lens[j])
				possible = false;

		possible_sgn[i] = possible;
		}

	if(ex_lens[0])
		{
		if(ex_lens[7])
			result_kbm = 2;
		else if(ex_lens[6])
			result_kbm = 1;
		else
			result_kbm = 0;

		possible_sgn[3] = true;
		}

	return result_kbm;
	}


public int FindSignalState(bool any_train, int OldState, bool[] possible_sig, bool ab4, int trmrk_flag, bool is_opend, bool is_shunt, bool sup_closed, int NextState)
// ����������� ���� ������� �� 
	{

	if(sup_closed)
		{
		if(is_opend and OldState == 2)
			return 2;

		if( possible_sig[1] )
			return 1;

		if(possible_sig[19])
			return 19;

		return 0;

		}


	if(is_shunt)		// ������
		{
		if(is_opend)// �������, �.�. ������ ������� 
			{
			Interface.Exception("shunt + train signals ?");
			return 0;

			}		



		if( possible_sig[21] and !any_train) // ���� ���� 2 �����, � ���� ��������
			return 21;
		if( possible_sig[20] )		// ���� 1 �����
			return 20;


		if( possible_sig[3] )		// ���� ������ �-��
			return 3;

		if( possible_sig[1] )		// ����� ��� - �������
			return 1;

		return 0;
		}

	if(!is_opend)		// �������� ������
		{
		if(OldState == 1)
			return 1;
		if(OldState == 2)
			return 2;

		if(possible_sig[1])	// ������� , �.�. �� ����� "��������", ��� �����
			return 1;


		if(possible_sig[19])	// �����
			return 19;

		return 0;
		}



//    �������� (����) ������ � �������� �������


	if(OldState == 2)		// �������� ��������� �������� �� ��������� ���������� �������
		return 2;


	if(any_train or NextState == 2)		// ������� ����� ��� ������������ �������
		{
		if(possible_sig[1])	// �������
			return 1;

		if(possible_sig[19])	// �����
			return 19;

		return 0;
		}

// ������ ������� ���



	if(OldState == 2)	// ������, �� ������� ����� ��� ��������� � �������� �������
		return 2;



	if(trmrk_flag & zxMarker.MRENDAB)	// �� ����
		{
		if( possible_sig[20] )	// ����������� �� ������
			return 20;

		if(possible_sig[1])	// �������
			return 1;


		if(possible_sig[19])	// �����
			return 19;

		return 0;
		}




	if(trmrk_flag & zxMarker.MRPAB)		// ���� ��� �� �� ������� �� ���������� �������
		{

		if(trmrk_flag & zxMarker.MRT)
			{
			if(possible_sig[4])		// ����� - �����
				return 4;
			}

			
		if(possible_sig[15])		// ��� ��
			return 15;

		if(possible_sig[14])		// ���
			return 14;
		
		return 0;
		}



	if(NextState == 1 or NextState == 3 or NextState == 18 or NextState == 20 or NextState == 21 or (trmrk_flag & zxMarker.MRNOPR))

// ��������� �������, ��� �����, ����� ��� ��+�, ��� ���� ��� ��������

		{

		if((trmrk_flag & zxMarker.MRHALFBL) and possible_sig[13])	// ����� - ����� - �����
			return 13;


		if(trmrk_flag & zxMarker.MRWW)	// ������������ ����
			{
			if((trmrk_flag & zxMarker.MRT) and possible_sig[24]) // ����� + ����� + ����� + ������	
				return 24;

			if(possible_sig[18])		// ����� ���. + �����
				return 18;
			
			if(possible_sig[4])		// ����� - �����
				return 4;

			if(possible_sig[6])		// �����
				return 6;

			if(possible_sig[14])		// ���� ����� ���, ������ ���
				return 14;

			return 0;

			}
		else if(trmrk_flag & zxMarker.MRALS)	// ���
			{

			if((trmrk_flag & zxMarker.MRT) and possible_sig[22]) // ����� + ����� + �����	
				return 22;

			if((trmrk_flag & zxMarker.MRT18) and possible_sig[24]) // ����� + ����� + ����� + ������	
				return 24;

			if(possible_sig[16])		// ����� + �����	
				return 16;

			if(possible_sig[6])		// �����
				return 6;

			return 0;
			}

		else if(trmrk_flag & zxMarker.MRDAB)	// �� ������������ ���� � ��
			{
			if(possible_sig[1])		// �������
				return 1;

			return 0;
			}
		else if(trmrk_flag & zxMarker.MRT)		// ����������
			{

			if(possible_sig[4])		// ����� - �����
				return 4;


			if(possible_sig[6])		// �����
				return 6;

			if(possible_sig[14])		// ���� ����� ���, ������ ���
				return 14;

			if(possible_sig[19])	// �����
				return 19;


			return 0;

			}

		else if(trmrk_flag & zxMarker.MRT18)		// ���������� �������
			{

			if(possible_sig[5])		// ����� - ����� - ������
				return 5;

			if(possible_sig[4])		// ����� - �����
				return 4;

			if(possible_sig[6])		// �����
				return 6;

			return 0;
			}

		else 					// ����������� ���
			{
			if(possible_sig[6])		// �����
				return 6;

			if(possible_sig[14])		// ���� ����� ���, ������ ���
				return 14;

			if(possible_sig[19])	// �����
				return 19;


			return 0;
			}
		}





	if(NextState == 4 or NextState == 7   or NextState == 13   or NextState == 22   or NextState == 23)		// ��������� ����������
		{

		if(trmrk_flag & zxMarker.MRWW)
			{
			if((trmrk_flag & zxMarker.MRT18) and possible_sig[25]) // ������ ���. + ����� + ����� + ������	
				return 25;

			if(possible_sig[18])		// ����� ���. + �����
				return 18;
			
			if(possible_sig[7])		// ����� �������� - �����
				return 7;

			if(possible_sig[11])		// ����� ��������
				return 11;

			return 0;

			}
		else if(trmrk_flag & zxMarker.MRALS)			// ��� 
			{
			if((trmrk_flag & zxMarker.MRT) and possible_sig[23])
				return 23;

			if((trmrk_flag & zxMarker.MRT18) and possible_sig[25]) // ������ ���. + ����� + ����� + ������	
				return 25;


			if(possible_sig[17])		// ������ + �����	
				return 17;

			if(possible_sig[11])		// ����� ��������
				return 11;

			return 0;
			}

		else if(trmrk_flag & zxMarker.MRDAB)	// �� ������������ ���� � ��
			{
			if(possible_sig[11])		// ����� ��������
				return 11;

			return 0;
			}
		else if(trmrk_flag & zxMarker.MRT)		// ����������
			{

			if(possible_sig[7])		// ����� �������� - �����
				return 7;


			if(possible_sig[11])		// ����� ��������
				return 11;


			return 0;
			}
		else if(trmrk_flag & zxMarker.MRT18)		// ���������� �������
			{
			if(possible_sig[8])		// ����� ���. - ����� - ������
				return 8;


			if(possible_sig[7])		// ����� �������� - �����
				return 7;

			if(possible_sig[11])		// ����� ��������
				return 11;


			return 0;

			}
		else					// ����������� ���
			{

			if(possible_sig[11])		// ����� ��������
				return 11;

			if(possible_sig[14])		// ���� ����� ���, ������ ���
				return 14;

			if(possible_sig[19])	// �����
				return 19;

			return 0;
			}

		}

	int NoState = zxMarker.MRT | zxMarker.MRT18 | zxMarker.MRWW | zxMarker.MRALS | zxMarker.MRDAB;


	if((NextState == 5 or NextState == 8 or NextState == 12 or NextState == 24 or NextState == 25 ) and 
	  (trmrk_flag & NoState)== 0)

		{
		if(possible_sig[10])		// ������ ��������
			return 10;

		if(possible_sig[14])		 
			return 14;		// ������

		return 0;
		}



	if(ab4 and (NextState == 6  or NextState == 10 or NextState == 11 or NextState == 15 or NextState ==  16) and !(trmrk_flag & zxMarker.MREND4AB) and ((trmrk_flag & NoState) == 0))
			// 4-������� ��

		{
		if(possible_sig[9])		// ����� ������
			return 9;

		if(possible_sig[14])		// ������
			return 14;

		return 0;
		}



// � ��������� ������� ������ (��� ����������������)

	if(trmrk_flag & zxMarker.MRWW)
		{
		if((trmrk_flag & zxMarker.MRT18) and possible_sig[25]) // ������ ���. + ����� + ����� + ������	
			return 25;

		if(possible_sig[18])		// ����� ���. + �����
			return 18;
			
		if(possible_sig[7])		// ����� �������� - �����
			return 7;

		if(possible_sig[11])		// ����� ��������
			return 11;

		return 0;
		}
	else if(trmrk_flag & zxMarker.MRALS)		// ��� 
		{
		if((trmrk_flag & zxMarker.MRT) and possible_sig[23])
			return 23;

		if((trmrk_flag & zxMarker.MRT18) and possible_sig[25]) // ������ ���. + ����� + ����� + ������	
			return 25;

		if(possible_sig[17])		// ������ + �����	
			return 17;

		if(possible_sig[14])		 
			return 14;		// ������

		if(possible_sig[16])		// ����� + �����	
			return 16;

		return 0;
		}

	else if(trmrk_flag & zxMarker.MRDAB)		// �� ������������ ���� � ��
		{
		if(possible_sig[15])		// ������ ������
			return 15;

		if(possible_sig[14])		 
			return 14;		// ������

		return 0;
		}

	else if(trmrk_flag & zxMarker.MRT)	// ����������
		{
		if(possible_sig[7])		// ����� �������� - �����
			return 7;


		if(possible_sig[14])		 
			return 14;		// ������

		if(possible_sig[19])	// �����
			return 19;

		if(possible_sig[6])		// �����
			return 6;



		return 0;

		}

	else if(trmrk_flag & zxMarker.MRT18)		// ���������� �������
		{
		if(possible_sig[12])		// ������ ���. - ����� - ������
			return 12;


		if(possible_sig[7])		// ����� �������� - �����
			return 7;

		if(possible_sig[14])		 
			return 14;		// ������

		return 0;
		}

	else
		{
		if(possible_sig[14])		 
			return 14;		// ������

		if(possible_sig[19])	// �����
			return 19;

		if(possible_sig[6])		// �����
			return 6;

		return 0;
		}


	return 0;
	}

};


