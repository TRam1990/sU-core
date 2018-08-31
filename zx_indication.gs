include "gs.gs"

include "common.gs"


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


public void Init()
	{
	inherited();
	ind_num=3;
	MainState=1;
	name="RWb";
	}

public void InitIndif(bool[] used_lens, bool[] blink_lens)
	{
	inherited(used_lens,blink_lens);
	used_lens[0]=true;
	used_lens[7]=true;		// линза, оборудованная мигалкой

	blink_lens[7]=true;
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

public define string lens = "RGGYYYWWBL";	// красный зелёный жёлтый синий белый зелёная_полоса

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


public void FindPossibleSgn(bool[] possible_sgn, bool[] ex_lens)
	{
	int i;
	bool[] Temp_st= new bool[10];
	bool[] Temp_2= new bool[10];

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

	}


public int FindSignalState(bool any_train, int OldState, bool[] possible_sig, bool ab4, int trmrk_mod, bool is_opend, bool is_shunt, int NextState)
// определение типа сигнала по 
	{

	if(is_shunt)		// манёвры
		{
		if(is_opend)// красный, т.к. ошибка скрипта 
			{
			Interface.Exception("shunt + train signals ?");
			return 0;

			}		



		if( possible_sig[21] and !any_train) // если есть 2 белых, и путь свободен
			return 21;
		if( possible_sig[20] )		// есть 1 белый
			return 20;


		if( possible_sig[3] )		// есть только К-Бм
			return 3;

		if( possible_sig[1] )		// белых нет - красный
			return 1;

		return 0;
		}

	if(!is_opend)		// светофор закрыт
		{
		if(OldState == 1)
			return 1;
		if(OldState == 2)
			return 2;

		if(possible_sig[1])	// красный , т.к. он более "закрытый", чем синий
			return 1;


		if(possible_sig[19])	// синий
			return 19;

		return 0;
		}



//    светофор (пред) открыт в поездном порядке


	if(OldState == 2)		// открытие обратного маршрута не позволяет развернуть перегон
		return 2;


	if(any_train or NextState == 2)		// впереди поезд или неправильный перегон
		{
		if(possible_sig[1])	// красный
			return 1;

		if(possible_sig[19])	// синий
			return 19;

		return 0;
		}

// поезда впереди нет



	if(OldState == 2)	// открыт, но перегон перед ним направлен в обратную сторону
		return 2;



	int trmrk_mod_2 = trmrk_mod;

	trmrk_mod_2 = trmrk_mod_2/10;

	trmrk_mod =  trmrk_mod % 10;


	if(trmrk_mod == 8)		// АБ нету
		{

		if(possible_sig[1])	// красный
			return 1;


		if(possible_sig[19])	// синий
			return 19;

		return 0;
		}




	if(trmrk_mod == 4)		// если ПАБ то не зависит от следующего сигнала
		{

		if(trmrk_mod_2 == 1)
			{
			if(possible_sig[4])		// жёлтый - жёлтый
				return 4;
			}

			
		if(possible_sig[15])		// ПАБ ЗЗ
			return 15;

		if(possible_sig[14])		// ПАБ
			return 14;
		
		return 0;
		}



	if(NextState == 1 or NextState == 3 or NextState == 18 or NextState == 20 or NextState == 21) // следующий красный, три жёлтых, белый или Жм+Б
		{


/*

trmrk_mod 


0 прямой путь
1 отклонение
2 отклонение пологое
3 неправильное (ЖмБ)
4 ПАБ (ЗЗ)
5 АЛС
6 неправильное с 2-сторонней блокировкой (ЗЗ)
7 маркер "располовиненого" пути (для ЖЖЖ)
8 конец АБ


*/

		if(trmrk_mod == 7 and possible_sig[13])	// жёлтый - жёлтый - жёлтый
			return 13;


		if(trmrk_mod == 0)
			{



			if(possible_sig[6])		// жёлтый
				return 6;

			if(possible_sig[14])		// если жёлтых нет, значит ПАБ
				return 14;

			if(possible_sig[19])	// синий
				return 19;


			return 0;
			}

		if(trmrk_mod == 1)		// отклонение
			{

			if(possible_sig[4])		// жёлтый - жёлтый
				return 4;


			if(possible_sig[6])		// жёлтый
				return 6;

			if(possible_sig[14])		// если жёлтых нет, значит ПАБ
				return 14;

			if(possible_sig[19])	// синий
				return 19;


			return 0;

			}

		if(trmrk_mod == 2)		// отклонение пологое
			{

			if(possible_sig[5])		// жёлтый - жёлтый - полоса
				return 5;

			if(possible_sig[4])		// жёлтый - жёлтый
				return 4;

			if(possible_sig[6])		// жёлтый
				return 6;

			return 0;
			}

		if(trmrk_mod == 3)
			{
			if(trmrk_mod_2 == 2 and possible_sig[24]) // жёлтый + жёлтый + белый + полоса	
				return 24;

			if(possible_sig[18])		// жёлтый миг. + белый
				return 18;
			
			if(possible_sig[4])		// жёлтый - жёлтый
				return 4;

			if(possible_sig[6])		// жёлтый
				return 6;

			if(possible_sig[14])		// если жёлтых нет, значит ПАБ
				return 14;

			return 0;

			}


		if(trmrk_mod == 5)			// АЛС
			{

			if(trmrk_mod_2 == 1 and possible_sig[22]) // жёлтый + жёлтый + белый	
				return 22;

			if(trmrk_mod_2 == 2 and possible_sig[24]) // жёлтый + жёлтый + белый + полоса	
				return 24;

			if(possible_sig[16])		// жёлтый + белый	
				return 16;

			if(possible_sig[6])		// жёлтый
				return 6;

			return 0;
			}

		if(trmrk_mod == 6)			// на неправильный путь с АБ
			{
			if(possible_sig[1])		// красный
				return 1;

			return 0;
			}

		}





	if(NextState == 4 or NextState == 7   or NextState == 13   or NextState == 22   or NextState == 23)		// следующее отклонение
		{

		if(trmrk_mod == 0)
			{

			if(possible_sig[11])		// жёлтый мигающий
				return 11;

			if(possible_sig[14])		// если жёлтых нет, значит ПАБ
				return 14;

			if(possible_sig[19])	// синий
				return 19;

			return 0;
			}


		if(trmrk_mod == 1)		// отклонение
			{

			if(possible_sig[7])		// жёлтый мигающий - жёлтый
				return 7;


			if(possible_sig[11])		// жёлтый мигающий
				return 11;


			return 0;
			}



		if(trmrk_mod == 2)		// отклонение пологое
			{
			if(possible_sig[8])		// жёлтый миг. - жёлтый - полоса
				return 8;


			if(possible_sig[7])		// жёлтый мигающий - жёлтый
				return 7;

			if(possible_sig[11])		// жёлтый мигающий
				return 11;


			return 0;

			}



		if(trmrk_mod == 3)
			{
			if(trmrk_mod_2 == 2 and possible_sig[25]) // зелёный миг. + жёлтый + белый + полоса	
				return 25;

			if(possible_sig[18])		// жёлтый миг. + белый
				return 18;
			
			if(possible_sig[7])		// жёлтый мигающий - жёлтый
				return 7;

			if(possible_sig[11])		// жёлтый мигающий
				return 11;

			return 0;

			}



		if(trmrk_mod == 5)			// АЛС 
			{
			if(trmrk_mod_2 == 1 and possible_sig[23])
				return 23;

			if(trmrk_mod_2 == 2 and possible_sig[25]) // зелёный миг. + жёлтый + белый + полоса	
				return 25;


			if(possible_sig[17])		// зелёный + белый	
				return 17;

			if(possible_sig[11])		// жёлтый мигающий
				return 11;

			return 0;
			}


		if(trmrk_mod == 6)			// на неправильный путь с АБ
			{
			if(possible_sig[11])		// жёлтый мигающий
				return 11;

			return 0;
			}

		}


	if((NextState == 5 or NextState == 8 or NextState == 12 or NextState == 24 or NextState == 25 ) and trmrk_mod == 0)
		{
		if(possible_sig[10])		// зелёный мигающий
			return 10;

		if(possible_sig[14])		 
			return 14;		// зелёный

		return 0;
		}





	if(ab4 and (NextState == 6  or NextState == 10 or NextState == 11 or NextState == 15 or NextState ==  16))			// 4-значная АБ
		{


		if(trmrk_mod == 0)
			{
			if(possible_sig[9])		// жёлтый зелёный
				return 9;

			if(possible_sig[14])		// зелёный
				return 14;

			return 0;
			}

		}



// в остальных случаях зелёный (или модифицированный)



	if(trmrk_mod == 0)
		{
		if(possible_sig[14])		 
			return 14;		// зелёный

		if(possible_sig[19])	// синий
			return 19;

		if(possible_sig[6])		// жёлтый
			return 6;

		return 0;
		}


	if(trmrk_mod == 1)	// отклонение
		{
		if(possible_sig[7])		// жёлтый мигающий - жёлтый
			return 7;


		if(possible_sig[14])		 
			return 14;		// зелёный

		if(possible_sig[19])	// синий
			return 19;

		if(possible_sig[6])		// жёлтый
			return 6;



		return 0;

		}



	if(trmrk_mod == 2)		// отклонение пологое
		{
		if(possible_sig[12])		// зелёный миг. - жёлтый - полоса
			return 12;


		if(possible_sig[7])		// жёлтый мигающий - жёлтый
			return 7;

		if(possible_sig[14])		 
			return 14;		// зелёный

		return 0;
		}



	if(trmrk_mod == 3)
		{
		if(trmrk_mod_2 == 2 and possible_sig[25]) // зелёный миг. + жёлтый + белый + полоса	
			return 25;

		if(possible_sig[18])		// жёлтый миг. + белый
			return 18;
			
		if(possible_sig[7])		// жёлтый мигающий - жёлтый
			return 7;

		if(possible_sig[11])		// жёлтый мигающий
			return 11;

		return 0;

		}



	if(trmrk_mod == 5)			// АЛС 
		{
		if(trmrk_mod_2 == 1 and possible_sig[23])
			return 23;

		if(trmrk_mod_2 == 2 and possible_sig[25]) // зелёный миг. + жёлтый + белый + полоса	
			return 25;

		if(possible_sig[17])		// зелёный + белый	
			return 17;

		if(possible_sig[14])		 
			return 14;		// зелёный

		if(possible_sig[16])		// жёлтый + белый	
			return 16;

		return 0;
		}


	if(trmrk_mod == 6)			// на неправильный путь с АБ
		{
		if(possible_sig[15])		// зелёный зелёный
			return 15;

		if(possible_sig[14])		 
			return 14;		// зелёный

		return 0;
		}



	return 0;
	}

};


