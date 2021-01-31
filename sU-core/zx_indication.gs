include "zx_specs.gs"


class zxIndication isclass GSObject
{
public string name;

public int MainState;
public int ind_num;

public define int STATE_R		= 1;
public define int STATE_Rx 		= 2;
public define int STATE_RWb		= 3;
public define int STATE_YY		= 4;
public define int STATE_YYL		= 5;
public define int STATE_Y		= 6;
public define int STATE_YbY		= 7;
public define int STATE_YbYL		= 8;
public define int STATE_GY		= 9;
public define int STATE_Gb		= 10;
public define int STATE_Yb		= 11;
public define int STATE_GbYL		= 12;
public define int STATE_YYY		= 13;
public define int STATE_G		= 14;
public define int STATE_GG		= 15;
public define int STATE_YW		= 16;
public define int STATE_GW		= 17;
public define int STATE_YbW		= 18;
public define int STATE_B		= 19;
public define int STATE_W		= 20;
public define int STATE_WW		= 21;
public define int STATE_YYW		= 22;
public define int STATE_YbYW		= 23;
public define int STATE_YYWL		= 24;
public define int STATE_GbYWL		= 25;

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
	ind_num = STATE_R;
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
	ind_num = STATE_Rx;
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
public int white_lens; // 0 - отсутствует, 1 - "немигающая", 2 - мигающая

public void Init()
	{
	inherited();
	ind_num = STATE_RWb;
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
			used_lens[6]=true;		// линза, оборудованная мигалкой
			blink_lens[6]=true;
			break;

		case 2:
		default:
			used_lens[7]=true;		// линза, оборудованная мигалкой
			blink_lens[7]=true;
		}
	}

};




class bb_YY isclass zxIndication
{

public void Init()
	{
	inherited();
	ind_num = STATE_YY;
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
	ind_num = STATE_YYL;
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
	ind_num = STATE_Y;
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
	ind_num = STATE_YbY;
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
	ind_num = STATE_YbYL;
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
	ind_num = STATE_GY;
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
	ind_num = STATE_Gb;
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
	ind_num = STATE_Yb;
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
	ind_num = STATE_GbYL;
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
	ind_num = STATE_YYY;
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
	ind_num = STATE_G;
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
	ind_num = STATE_GG;
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
	ind_num = STATE_YW;
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
	ind_num = STATE_GW;
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
	ind_num = STATE_YbW;
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
	ind_num = STATE_B;
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
	ind_num = STATE_W;
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
	ind_num = STATE_WW;
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
	ind_num = STATE_YYW;
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
	ind_num = STATE_YbYW;
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
	ind_num = STATE_YYWL;
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
	ind_num = STATE_GbYWL;
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
	sgn_st[zxIndication.STATE_R].l = R;	
	sgn_st[zxIndication.STATE_Rx].l = Rx;	
	sgn_st[zxIndication.STATE_RWb].l = RWb;	
	sgn_st[zxIndication.STATE_YY].l = YY;	
	sgn_st[zxIndication.STATE_YYL].l = YYL;	
	sgn_st[zxIndication.STATE_Y].l = Y;
	sgn_st[zxIndication.STATE_YbY].l = YbY;	
	sgn_st[zxIndication.STATE_YbYL].l = YbYL;
	sgn_st[zxIndication.STATE_GY].l = GY;
	sgn_st[zxIndication.STATE_Gb].l = Gb;
	sgn_st[zxIndication.STATE_Yb].l = Yb;
	sgn_st[zxIndication.STATE_GbYL].l = GbYL;
	sgn_st[zxIndication.STATE_YYY].l = YYY;	
	sgn_st[zxIndication.STATE_G].l = G;
	sgn_st[zxIndication.STATE_GG].l = GG;
	sgn_st[zxIndication.STATE_YW].l = YW;
	sgn_st[zxIndication.STATE_GW].l = GW;
	sgn_st[zxIndication.STATE_YbW].l = YbW;
	sgn_st[zxIndication.STATE_B].l = B;
	sgn_st[zxIndication.STATE_W].l = W;
	sgn_st[zxIndication.STATE_WW].l = WW;
	sgn_st[zxIndication.STATE_YYW].l = YYW;
	sgn_st[zxIndication.STATE_YbYW].l = YbYW;
	sgn_st[zxIndication.STATE_YYWL].l = YYWL;
	sgn_st[zxIndication.STATE_GbYWL].l = GbYWL;

	for(i=0;i<26;i++)
		sgn_st[i].l.Init();

	}


public int FindPossibleSgn(bool[] possible_sgn, bool[] ex_lens, bool prigl_enabled)		// К-Бм - белая линза - 0 - отсутствует, 1 - "немигающая", 2 - мигающая
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
		if(!prigl_enabled and ex_lens[6])
			result_kbm = 0;
		else
			{
			if(ex_lens[7])
				result_kbm = 2;
			else if(ex_lens[6])
				result_kbm = 1;
			else
				result_kbm = 0;
			}

		possible_sgn[zxIndication.STATE_RWb] = (result_kbm > 0);	// случай result_kbm == 0 не используется
		}
	else
		possible_sgn[zxIndication.STATE_RWb] = false;

	return result_kbm;
	}


public int FindPossibleSgn(bool[] possible_sgn, bool[] ex_lens)	
	{
	return FindPossibleSgn(possible_sgn, ex_lens, true);
	}

	public bool applaySignalState(zxSignal sign, zxSignal nextSign, int trmrk_flag, bool sub_closed)
	{
		int oldMainState = sign.MainState;
		int oldRCCount = sign.RCCount;
		sign.RCCount = 0;
		if (nextSign) {
			sign.RCCount = nextSign.RCCount + 1;
			if (nextSign.x_mode) {
				trmrk_flag = trmrk_flag | zxMarker.MRALS;
			}
		}

		if (sign.prigl_open and sign.ex_sgn[zxIndication.STATE_RWb]) {
			sign.MainState = zxIndication.STATE_RWb;
		}
		else if (sign.MainState == zxIndication.STATE_Rx) {
		}
		else if (sub_closed) {
			if (sign.ex_sgn[zxIndication.STATE_R]) {
				sign.MainState = zxIndication.STATE_R;
			}
			else if (sign.ex_sgn[zxIndication.STATE_B]) {
				sign.MainState = zxIndication.STATE_B;
			}
			else {
				sign.MainState = 0;
			}
		}
		else if (sign.shunt_open) {		// манёвры
			if(sign.train_open) {// красный, т.к. ошибка скрипта
				Interface.Exception("shunt + train signals ?");
			}
			else if (sign.ex_sgn[zxIndication.STATE_WW] and nextSign) {// если есть 2 белых, и путь свободен
				sign.MainState = zxIndication.STATE_WW;
			}
			else if (sign.ex_sgn[zxIndication.STATE_W]) {		// есть 1 белый
				sign.MainState = zxIndication.STATE_W;
			}
			else if (sign.ex_sgn[zxIndication.STATE_RWb]) {		// есть только К-Бм
				sign.MainState = zxIndication.STATE_RWb;
			}
			else if (sign.ex_sgn[zxIndication.STATE_R]) {		// белых нет - красный
				sign.MainState = zxIndication.STATE_R;
			}
			else {
				sign.MainState = 0;
			}
		}
		else if (!sign.train_open and !sign.x_mode) {	// светофор закрыт
			if (sign.ex_sgn[zxIndication.STATE_R]) {	// красный , т.к. он более "закрытый", чем синий
				sign.MainState = zxIndication.STATE_R;
			}
			else if (sign.ex_sgn[zxIndication.STATE_B]) {	// синий
				sign.MainState = zxIndication.STATE_B;
			}
			else {
				sign.MainState = 0;
			}
		}
		//    светофор (пред) открыт в поездном порядке
		else {
			bool x_mode = sign.x_mode or (nextSign and nextSign.x_mode);
			if (
				!nextSign
				or (nextSign.wrong_dir and (sign.Type & (zxSignal.ST_UNLINKED | zxSignal.ST_PERMOPENED) ) != (zxSignal.ST_UNLINKED | zxSignal.ST_PERMOPENED) )
				or (((nextSign.MainState == zxIndication.STATE_W) or (nextSign.MainState == zxIndication.STATE_WW)) and !(nextSign.Type & (zxSignal.ST_IN | zxSignal.ST_OUT | zxSignal.ST_ROUTER)))
				or (x_mode and nextSign.MainStateALS == 0)
			) {		// впереди поезд или неправильный перегон
				if (sign.ex_sgn[zxIndication.STATE_R] or sign.x_mode) {	// красный
					sign.MainState = zxIndication.STATE_R;
				}
				else if(sign.ex_sgn[zxIndication.STATE_B]) {	// синий
					sign.MainState = zxIndication.STATE_B;
				}
				else {
					sign.MainState = 0;
				}
			}
			// поезда впереди нет
			else if (trmrk_flag & zxMarker.MRENDAB) {	// АБ нету
				if (sign.ex_sgn[zxIndication.STATE_W]) {	// отправление по белому
					sign.MainState = zxIndication.STATE_W;
				}
				else if(sign.ex_sgn[zxIndication.STATE_R]) {	// красный
					sign.MainState = zxIndication.STATE_R;
				}
				else if(sign.ex_sgn[zxIndication.STATE_B]) {	// синий
					sign.MainState = zxIndication.STATE_B;
				}
				else {
					sign.MainState = 0;
				}
			}
			else if (trmrk_flag & zxMarker.MRPAB) {		// если ПАБ то не зависит от следующего сигнала
				if ((trmrk_flag & zxMarker.MRT) and (sign.ex_sgn[zxIndication.STATE_YY])) {		// жёлтый - жёлтый
					sign.MainState = zxIndication.STATE_YY;
				}
				else if (sign.ex_sgn[zxIndication.STATE_GG]) {		// ПАБ ЗЗ
					sign.MainState = zxIndication.STATE_GG;
				}
				else if(sign.ex_sgn[zxIndication.STATE_G]) {		// ПАБ
					sign.MainState = zxIndication.STATE_G;
				}
				else {
					sign.MainState = 0;
				}
			}
			else if (
				(
					nextSign.MainStateALS == zxIndication.STATE_R
					or nextSign.MainStateALS == zxIndication.STATE_RWb
					or nextSign.MainStateALS == zxIndication.STATE_YbW
					or nextSign.MainStateALS == zxIndication.STATE_W
					or nextSign.MainStateALS == zxIndication.STATE_WW
				)
				or (trmrk_flag & zxMarker.MRNOPR)
			) {	// следующий красный, три жёлтых, белый или Жм+Б, или путь без пропуска
				if (trmrk_flag & zxMarker.MRHALFBL) {
					if (sign.ex_sgn[zxIndication.STATE_YYY]) {	// жёлтый - жёлтый - жёлтый
						sign.MainState = zxIndication.STATE_YYY;
					}
					else if (sign.ex_sgn[zxIndication.STATE_R]) {	// красный
						sign.MainState = zxIndication.STATE_R;
					}
					else {
						sign.MainState = 0;
					}
				}
				else if(trmrk_flag & zxMarker.MRWW) {	// неправильный путь
					if ((trmrk_flag & zxMarker.MRT) and sign.ex_sgn[zxIndication.STATE_YYWL]) { // жёлтый + жёлтый + белый + полоса	
						sign.MainState = zxIndication.STATE_YYWL;
					}
					else if (sign.ex_sgn[zxIndication.STATE_YbW]) {		// жёлтый миг. + белый
						sign.MainState = zxIndication.STATE_YbW;
					}
					else if (sign.ex_sgn[zxIndication.STATE_YY]) {		// жёлтый - жёлтый
						sign.MainState = zxIndication.STATE_YY;
					}
					else if (sign.ex_sgn[zxIndication.STATE_Y]) {		// жёлтый
						sign.MainState = zxIndication.STATE_Y;
					}
					else if (sign.ex_sgn[zxIndication.STATE_G]) {		// если жёлтых нет, значит ПАБ
						sign.MainState = zxIndication.STATE_G;
					}
					else {
						sign.MainState = 0;
					}
				}
				else if(trmrk_flag & zxMarker.MRALS) {	// АЛС
					if ((trmrk_flag & zxMarker.MRT) and sign.ex_sgn[zxIndication.STATE_YYW]) { // жёлтый + жёлтый + белый
						sign.MainState = zxIndication.STATE_YYW;
					}
					else if ((trmrk_flag & zxMarker.MRT18) and sign.ex_sgn[zxIndication.STATE_YYWL]) { // жёлтый + жёлтый + белый + полоса	
						sign.MainState = zxIndication.STATE_YYWL;
					}
					else if (sign.ex_sgn[zxIndication.STATE_YW]) {		// жёлтый + белый	
						sign.MainState = zxIndication.STATE_YW;
					}
					else if (sign.ex_sgn[zxIndication.STATE_Y] or sign.x_mode) {		// жёлтый
						sign.MainState = zxIndication.STATE_Y;
					}
					else {
						sign.MainState = 0;
					}
				}
				else if ((trmrk_flag & zxMarker.MRDAB) and (sign.ex_sgn[zxIndication.STATE_GG] or !sign.ex_sgn[zxIndication.STATE_Y]) and sign.ex_sgn[zxIndication.STATE_R]) {	// на неправильный путь с АБ
					// если есть 2 зелёных или нет жёлтого
					sign.MainState = zxIndication.STATE_R;
				}
				else if(trmrk_flag & zxMarker.MRT) {		// отклонение
					if (sign.ex_sgn[zxIndication.STATE_YY]) {		// жёлтый - жёлтый
						sign.MainState = zxIndication.STATE_YY;
					}
					else if (sign.ex_sgn[zxIndication.STATE_Y])	{	// жёлтый
						sign.MainState = zxIndication.STATE_Y;
					}
					else if (sign.ex_sgn[zxIndication.STATE_G]) {		// если жёлтых нет, значит ПАБ
						sign.MainState = zxIndication.STATE_G;
					}
					else if (sign.ex_sgn[zxIndication.STATE_B]) {	// синий
						sign.MainState = zxIndication.STATE_B;
					}
					else {
						sign.MainState = 0;
					}
				}
				else if (trmrk_flag & zxMarker.MRT18) {		// отклонение пологое
					if (sign.ex_sgn[zxIndication.STATE_YYL]) {		// жёлтый - жёлтый - полоса
						sign.MainState = zxIndication.STATE_YYL;
					}
					else if (sign.ex_sgn[zxIndication.STATE_YY]) {		// жёлтый - жёлтый
						sign.MainState = zxIndication.STATE_YY;
					}
					else if(sign.ex_sgn[zxIndication.STATE_Y]) {		// жёлтый
						sign.MainState = zxIndication.STATE_Y;
					}
					else {
						sign.MainState = 0;
					}
				}
				else {		// модификаций нет
					if (sign.ex_sgn[zxIndication.STATE_Y]) {		// жёлтый
						sign.MainState = zxIndication.STATE_Y;
					}
					else if (sign.ex_sgn[zxIndication.STATE_G]) {		// если жёлтых нет, значит ПАБ
						sign.MainState = zxIndication.STATE_G;
					}
					else if (sign.ex_sgn[zxIndication.STATE_B]) {	// синий
						sign.MainState = zxIndication.STATE_B;
					}
					else {
						sign.MainState = 0;
					}
				}
			}
			else if (nextSign.MainStateALS == zxIndication.STATE_YY or nextSign.MainStateALS == zxIndication.STATE_YbY or nextSign.MainStateALS == zxIndication.STATE_YYY or nextSign.MainStateALS == zxIndication.STATE_YYW or nextSign.MainStateALS == zxIndication.STATE_YbYW) {		// следующее отклонение
				if (trmrk_flag & zxMarker.MRWW) {
					if ((trmrk_flag & zxMarker.MRT18) and sign.ex_sgn[zxIndication.STATE_GbYWL]) { // зелёный миг. + жёлтый + белый + полоса
						sign.MainState = zxIndication.STATE_GbYWL;
					}
					else if (sign.ex_sgn[zxIndication.STATE_YbW]) {		// жёлтый миг. + белый
						sign.MainState = zxIndication.STATE_YbW;
					}
					else if (sign.ex_sgn[zxIndication.STATE_YbY]) {		// жёлтый мигающий - жёлтый
						sign.MainState =  zxIndication.STATE_YbY;
					}
					else if ((trmrk_flag & zxMarker.MRNOYLBL) and sign.ex_sgn[zxIndication.STATE_G]) {	// зелёный
						sign.MainState = zxIndication.STATE_G;
					}
					else if (sign.ex_sgn[zxIndication.STATE_Yb]) {		// жёлтый мигающий
						sign.MainState = zxIndication.STATE_Yb;
					}
					else {
						sign.MainState = 0;
					}
				}
				else if (trmrk_flag & zxMarker.MRALS) {			// АЛС 
					if ((trmrk_flag & zxMarker.MRT) and sign.ex_sgn[zxIndication.STATE_YbYW]) {
						sign.MainState = zxIndication.STATE_YbYW;
					}
					else if ((trmrk_flag & zxMarker.MRT18) and sign.ex_sgn[zxIndication.STATE_GbYWL]) { // зелёный миг. + жёлтый + белый + полоса	
						sign.MainState = zxIndication.STATE_GbYWL;
					}
					else if ((trmrk_flag & zxMarker.MRNOYLBL) and sign.ex_sgn[zxIndication.STATE_GW]) {	// зелёный + белый
						sign.MainState = zxIndication.STATE_GW;
					}
					else if (sign.ex_sgn[zxIndication.STATE_YbW]) {		// жёлтый миг. + белый
						sign.MainState = zxIndication.STATE_YbW;
					}
					else if (sign.ex_sgn[zxIndication.STATE_GW] or sign.x_mode) {		// зелёный + белый	
						sign.MainState = zxIndication.STATE_GW;
					}
					else if (sign.ex_sgn[zxIndication.STATE_Yb]) {		// жёлтый мигающий
						sign.MainState = zxIndication.STATE_Yb;
					}
					else {
						sign.MainState = 0;
					}
				}
				else if ((trmrk_flag & zxMarker.MRDAB) and sign.ex_sgn[zxIndication.STATE_GG]) {	// на неправильный путь с АБ
					if ((trmrk_flag & zxMarker.MRNOYLBL) and sign.ex_sgn[zxIndication.STATE_G]) {	// зелёный
						sign.MainState = zxIndication.STATE_G;
					}
					else if (sign.ex_sgn[zxIndication.STATE_Yb]) {		// жёлтый мигающий
						sign.MainState = zxIndication.STATE_Yb;
					}
					else {
						sign.MainState = 0;
					}
				}
				else if (trmrk_flag & zxMarker.MRT) {		// отклонение
					if (sign.ex_sgn[zxIndication.STATE_YbY]) {		// жёлтый мигающий - жёлтый
						sign.MainState = zxIndication.STATE_YbY;
					}
					else if ((trmrk_flag & zxMarker.MRNOYLBL) and sign.ex_sgn[zxIndication.STATE_G]) {	// зелёный
						sign.MainState = zxIndication.STATE_G;
					}
					else if (sign.ex_sgn[zxIndication.STATE_Yb]) {		// жёлтый мигающий
						sign.MainState = zxIndication.STATE_Yb;
					}
					else {
						sign.MainState = 0;
					}
				}
				else if (trmrk_flag & zxMarker.MRT18) {		// отклонение пологое
					if (sign.ex_sgn[zxIndication.STATE_YbYL]) {		// жёлтый миг. - жёлтый - полоса
						sign.MainState = zxIndication.STATE_YbYL;
					}
					else if (sign.ex_sgn[zxIndication.STATE_YbY]) {		// жёлтый мигающий - жёлтый
						sign.MainState = zxIndication.STATE_YbY;
					}
					else if (sign.ex_sgn[zxIndication.STATE_G]) {		// зелёный (если двух жёлтых на светофоре нет и есть маркер отклонения)
						sign.MainState = zxIndication.STATE_G;
					}
					else if (sign.ex_sgn[zxIndication.STATE_Yb]) {		// жёлтый мигающий
						sign.MainState = zxIndication.STATE_Yb;
					}
					else {
						sign.MainState = 0;
					}
				}
				else {					// модификаций нет
					if ((trmrk_flag & zxMarker.MRNOYLBL) and sign.ex_sgn[zxIndication.STATE_G]) {	// зелёный
						sign.MainState = zxIndication.STATE_G;
					}
					else if (sign.ex_sgn[zxIndication.STATE_Yb]) {		// жёлтый мигающий
						sign.MainState = zxIndication.STATE_Yb;
					}
					else if (sign.ex_sgn[zxIndication.STATE_G]) {		// если жёлтых нет, значит ПАБ
						sign.MainState = zxIndication.STATE_G;
					}
					else if (sign.ex_sgn[zxIndication.STATE_B]) {	// синий
						sign.MainState = zxIndication.STATE_B;
					}
					else {
						sign.MainState = 0;
					}
				}
			}
			else {
				int NoState = zxMarker.MRT | zxMarker.MRT18 | zxMarker.MRWW | zxMarker.MRALS | zxMarker.MRDAB;
				if ((nextSign.MainStateALS == zxIndication.STATE_YYL or nextSign.MainStateALS == zxIndication.STATE_YbYL or nextSign.MainStateALS == zxIndication.STATE_GbYL or nextSign.MainStateALS == zxIndication.STATE_YYWL or nextSign.MainStateALS == zxIndication.STATE_GbYWL) and (trmrk_flag & NoState)== 0) {
					if ((trmrk_flag & zxMarker.MRNOYLBL) and sign.ex_sgn[zxIndication.STATE_G]) {	// зелёный
						sign.MainState = zxIndication.STATE_G;
					}
					else if (sign.ex_sgn[zxIndication.STATE_Gb]) {		// зелёный мигающий
						sign.MainState = zxIndication.STATE_Gb;
					}
					else if (sign.ex_sgn[zxIndication.STATE_G]) {
						sign.MainState = zxIndication.STATE_G;		// зелёный
					}
					else {
						sign.MainState = 0;
					}
				}
				// в остальных случаях зелёный (или модифицированный)
				else if (trmrk_flag & zxMarker.MRWW) {
					if ((trmrk_flag & zxMarker.MRT18) and sign.ex_sgn[zxIndication.STATE_GbYWL]) { // зелёный миг. + жёлтый + белый + полоса	
						sign.MainState = zxIndication.STATE_GbYWL;
					}
					else if ((trmrk_flag & zxMarker.MRNOYLBL) and sign.ex_sgn[zxIndication.STATE_GW]) {	// зелёный + белый
						sign.MainState = zxIndication.STATE_GW;
					}
					else if (sign.ex_sgn[zxIndication.STATE_YbW]) {		// жёлтый миг. + белый
						sign.MainState = zxIndication.STATE_YbW;
					}
					else if (sign.ex_sgn[zxIndication.STATE_YbY]) {		// жёлтый мигающий - жёлтый
						sign.MainState = zxIndication.STATE_YbY;
					}
					else if (sign.ex_sgn[zxIndication.STATE_Yb]) {		// жёлтый мигающий
						sign.MainState = zxIndication.STATE_Yb;
					}
					else {
						sign.MainState = 0;
					}
				}
				else {
					bool sig_GY_on = (sign.ab4 and sign.ex_sgn[zxIndication.STATE_GY] and (nextSign.MainStateALS == zxIndication.STATE_Y or (nextSign.MainStateALS == zxIndication.STATE_Yb and !(trmrk_flag & zxMarker.MRGR4ABFL)) or nextSign.MainStateALS == zxIndication.STATE_GG or nextSign.MainStateALS == zxIndication.STATE_YW) and !(trmrk_flag & zxMarker.MREND4AB));
					if(trmrk_flag & zxMarker.MRALS) {		// АЛС 
						if ((trmrk_flag & zxMarker.MRT) and sign.ex_sgn[zxIndication.STATE_YbYW]) {
							sign.MainState = zxIndication.STATE_YbYW;
						}
						else if ((trmrk_flag & zxMarker.MRT18) and sign.ex_sgn[zxIndication.STATE_GbYWL]) { // зелёный миг. + жёлтый + белый + полоса
							sign.MainState = zxIndication.STATE_GbYWL;
						}
						else if (sign.ex_sgn[zxIndication.STATE_GW]) {		// зелёный + белый	
							sign.MainState = zxIndication.STATE_GW;
						}
						else if (sig_GY_on) {	// жёлтый зелёный
							sign.MainState = zxIndication.STATE_GY;
						}
						else if (sign.ex_sgn[zxIndication.STATE_G] or sign.x_mode) {
							sign.MainState = zxIndication.STATE_G;		// зелёный
						}
						else if (sign.ex_sgn[zxIndication.STATE_YW]) {		// жёлтый + белый	
							sign.MainState = zxIndication.STATE_YW;
						}
						else {
							sign.MainState = 0;
						}
					}
					else if ((trmrk_flag & zxMarker.MRDAB) and sign.ex_sgn[zxIndication.STATE_GG]) {		// на неправильный путь с АБ
						sign.MainState = zxIndication.STATE_GG;		// зелёный зелёный
					}
					else if (trmrk_flag & zxMarker.MRT) {	// отклонение
						if (sign.ex_sgn[zxIndication.STATE_YbY]) {		// жёлтый мигающий - жёлтый
							sign.MainState = zxIndication.STATE_YbY;
						}
						else if (sig_GY_on) {	// жёлтый зелёный
							sign.MainState = zxIndication.STATE_GY;
						}
						else if (sign.ex_sgn[zxIndication.STATE_G]) {
							sign.MainState = zxIndication.STATE_G;		// зелёный
						}
						else if (sign.ex_sgn[zxIndication.STATE_B]) {		// синий
							sign.MainState = zxIndication.STATE_B;
						}
						else if (sign.ex_sgn[zxIndication.STATE_Y]) {		// жёлтый
							sign.MainState = zxIndication.STATE_Y;
						}
						else {
							sign.MainState = 0;
						}
					}
					else if (trmrk_flag & zxMarker.MRT18) {		// отклонение пологое
						if (sign.ex_sgn[zxIndication.STATE_GbYL]) {		// зелёный миг. - жёлтый - полоса
							sign.MainState = zxIndication.STATE_GbYL;
						}
						else if (sign.ex_sgn[zxIndication.STATE_YbY]) {		// жёлтый мигающий - жёлтый
							sign.MainState = zxIndication.STATE_YbY;
						}
						else if (sig_GY_on) {	// жёлтый зелёный
							sign.MainState = zxIndication.STATE_GY;
						}
						else if (sign.ex_sgn[zxIndication.STATE_G]) {
							sign.MainState = zxIndication.STATE_G;		// зелёный
						}
						else {
							sign.MainState = 0;
						}
					}
					else {
						if (sig_GY_on) {	// жёлтый зелёный
							sign.MainState = zxIndication.STATE_GY;
						}
						else if (sign.ex_sgn[zxIndication.STATE_G]) {
							sign.MainState = zxIndication.STATE_G;		// зелёный
						}
						else if (sign.ex_sgn[zxIndication.STATE_B]) {		// синий
							sign.MainState = zxIndication.STATE_B;
						}
						else if (sign.ex_sgn[zxIndication.STATE_Y]) {		// жёлтый
							sign.MainState = zxIndication.STATE_Y;
						}
						else {
							sign.MainState = 0;
						}					
					}
				}
			}
		}

		if (sub_closed and sign.protect_influence) {
			sign.MainStateALS = 0;
		}
		else if (!sign.x_mode or sign.MainState == zxIndication.STATE_RWb) {
			sign.MainStateALS = sign.MainState;
		}
		else if (sign.RCCount < sign.distanceRY) {
			sign.MainStateALS = 0;
		}
		else if (sign.RCCount < sign.distanceY) {
			sign.MainStateALS = zxIndication.STATE_R;
		}
		else if (sign.RCCount < sign.distanceG) {
			sign.MainStateALS = zxIndication.STATE_Y;
		}
		else {
			sign.MainStateALS = zxIndication.STATE_G;
		}

		if ((!sign.train_open and !sign.x_mode) or sign.prigl_open) {
			sign.RCCount = sign.distanceRY;
		}
		else if (
			!sign.x_mode
			or (trmrk_flag & zxMarker.MRFORBIDXMODE)
		) {
			if (sign.MainState == zxIndication.STATE_R or sign.MainState == zxIndication.STATE_RWb or ((sign.MainState == zxIndication.STATE_W or sign.MainState == zxIndication.STATE_WW) and sign.Type & (zxSignal.ST_IN | zxSignal.ST_OUT | zxSignal.ST_ROUTER))) {
				sign.RCCount = sign.distanceRY;
			}
			else if ((sign.MainState >= zxIndication.STATE_YY and sign.MainState <= zxIndication.STATE_YbY) or sign.MainState == zxIndication.STATE_YYY or sign.MainState == zxIndication.STATE_YW or sign.MainState == zxIndication.STATE_YbW or sign.MainState == zxIndication.STATE_YYW or sign.MainState == zxIndication.STATE_YbYW) {
				sign.RCCount = sign.distanceY;
			}
			else if (sign.yellow_code and (sign.MainState == zxIndication.STATE_GY or sign.MainState == zxIndication.STATE_Yb)) {
				sign.RCCount = sign.distanceY;
			}
			else if (sign.MainState >= zxIndication.STATE_GY and sign.MainState != zxIndication.STATE_B) {
				sign.RCCount = sign.distanceG;
			}
			else if (sign.MainState == zxIndication.STATE_B) {
				sign.RCCount = sign.distanceY;
			}
			else {
				sign.RCCount = 0;
			}
		}


		return sign.MainState != oldMainState or (sign.RCCount != oldRCCount and Math.Max(sign.RCCount, oldRCCount) <= sign.distanceG);
	}

public int FindSignalState(bool any_train, int OldState, bool[] possible_sig, bool ab4, int trmrk_flag, bool is_opend, bool is_shunt, bool sub_closed, int NextState)	//для совместимости
	{
	return 0;
	}

};
