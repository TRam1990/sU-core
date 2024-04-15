include "zx_specs.gs"
include "zx_meshcontrol.gs"
include "zx_router.gs"
include "zx_symbol_trans.gs"




class zxSignal_main isclass zxSignal			// то, что не важно для связи с будкой
{
Library  mainLib;
GSObject[] GSO;

public zxLightContainer LC;
public zxMeshController MC;


public bool[] set_lens;
public bool[] set_blink;


public string lens_kit;
public int lens_kit_n;

public int OldMainState = -1;

public int kbm_mode = 2;


StringTable ST, STT;
Asset tabl_m,tex,gol_tex;

MeshObject[] lens;

float displacement;

float def_displ;

float vert_displ;
float along_displ;

string zxSP_name;
GameObjectID zxSP_id;
string MU_name;
GameObjectID MU_id;


bool isMacht = false;
string head_conf;

float head_rot = 0;
float head_krepl_rot = 0;

bool station_edited = false;

bool pre_protected = false;

float pause_bef_red = 3.5;


bool dis_koz;
bool[] koz_mesh;
int[] gol_tex_id;



public bool predvhod = false;
public bool kor_BU_1;
public bool kor_BU_2;
MeshObject[] kor_BU;

public zxRouter MU;


string name_decoded;
Soup NullSoup;


int[] blink_lens;
bool blink_state;


string[] GetLensKit();
void CreateLinsArr(string s, bool[] ex_lins, int[] pos_lins);
int FindTypeByLens(bool[] ex_lins);
void GetDefaultSignalLimits();
void SetBUArrow(bool state);


define float DegToRad = 0.01745;

bool ever_inited = false;
bool default_init = true;


int BlinkLensCount()
	{
	int i,j=0;
	for(i=0;i<10;i++)
		{
		if(set_blink[i])
			j++;
		}
	return j;	
	}


public bool SetBlink()
	{
	int blink_count = BlinkLensCount();

	if(blink_count == 0)
		{
		if(blink_lens.size() > 0)
			blink_lens[0,] = null;
		return false;
		}

	blink_lens = new int[blink_count];

	int i,j=0;
	for(i=0;i<10;i++)
		{
		if(set_blink[i])
			{
			blink_lens[j]=i;
			j++;
			}
		}

	blink_state = true;

	mainLib.LibraryCall("blink_start",null,GSO);

	return true;
	}


public bool ToggleBlinker()
	{
	if((blink_lens.size() <= 0) or !set_blink[blink_lens[0]])
		return false;

	blink_state = !blink_state;

	int i;
	for(i=0;i<blink_lens.size();i++)
		MC.SetMesh(blink_lens[i],blink_state);

	return true;
	}


public thread void NewSignal(bool[] set_lens, float dt1, float dt2)
	{
	if(dt1 != 0)
		Sleep(dt1);
	MC.OffMeshes(set_lens);
	Sleep(dt2);
	MC.SetMeshes(set_lens);

	SetBlink();
	}



thread void MUChecker()
	{
	Sleep(0.7);
	MU.UpdateMU();
	}


bool SetOwnSignalState(bool set_auto_state)
	{
	if(MainState!=OldMainState)
		{
		if(kor_BU)
			SetBUArrow( !(MainState == 0 or MainState == zxIndication.STATE_R or MainState == zxIndication.STATE_Rx or MainState == zxIndication.STATE_B) );


		if(MU_id)
			{
			if(!linkedMU)
				linkedMU= cast<Trackside>Router.GetGameObject(MU_id);

			if(linkedMU)
				{
				if(MainState == zxIndication.STATE_R)
					PostMessage(linkedMU,"UpdateMU","Update",0);
				else
					PostMessage(linkedMU,"UpdateMU","Update",0.7);
				}
			}

		if(MU) {
			if (x_mode) {
				if (MU.typeMatrix == "99") {
					MU.OnLightsRouterSign("x ");
				}
				else {
					MU.OnLightsRouterSign("x");
				}
				MU.WasOpen = true;
			}
			else if(MainState == zxIndication.STATE_R) {
				MU.UpdateMU();
			}
			else {
				MUChecker();
			}
		}

		if(MainState == zxIndication.STATE_RWb)
			(cast<bb_RWb>LC.sgn_st[zxIndication.STATE_RWb].l).white_lens = kbm_mode;

		if (x_mode and MainState != zxIndication.STATE_RWb) {
			LC.sgn_st[0].l.InitIndif(set_lens, set_blink);
		}
		else {
			LC.sgn_st[MainState].l.InitIndif(set_lens, set_blink);
		}

		if(set_auto_state)
			{
			if(MainState == zxIndication.STATE_R or MainState == 0)
				SetSignalState(null, RED, "");
			else if((MainState > zxIndication.STATE_R and MainState < zxIndication.STATE_GY) or MainState == zxIndication.STATE_YYY or MainState == zxIndication.STATE_YW or MainState == zxIndication.STATE_YbW or MainState == zxIndication.STATE_YYW or MainState == zxIndication.STATE_YbYW)
				SetSignalState(null, YELLOW, "");
			else
				SetSignalState(null, GREEN, "");
			}

		// задание номинальных скоростей светофора

		SetMainStateSpeedLim();


		OldMainState = MainState;
		return true;
		}

	return false;
	}


public void SetSignal(bool set_auto_state)
	{
	if(SetOwnSignalState(set_auto_state))
		{
		if(MainState == zxIndication.STATE_R)
			NewSignal(set_lens,0,pause_bef_red);
		else
			NewSignal(set_lens,0,0.7);
		}
	}



public void CheckPrevSignals(bool no_train)
	{

	string[] track_params = new string[2];

	if((!Inited or !IsObligatory()) and (!protect_influence or !barrier_closed))
		{
		return;
		}
	

	mainLib.LibraryCall("find_prev_signal",track_params,GSO);


	if(!Cur_prev or !Cur_prev.Inited)
		return;

	zxSignal tmpSign = null;
	if ( ((track_params[0])[0] != '+') and ((track_params[0])[1] != '+')) {
		tmpSign = me;
	}
	if (LC.applaySignalState(Cur_prev, tmpSign, Str.ToInt(track_params[1]), (track_params[0])[1] == '+'))
		{
		Cur_prev.CheckPrevSignals(false);

		Cur_prev.SetSignal(true);
		Cur_prev.ApplyNewSpeedLimit(-1);

		if(IsServer)
			{
			GSObject[] GSO2=new GSObject[1];
			GSO2[0] = cast<GSObject>Cur_prev;
			mainLib.LibraryCall("mult_settings",null,GSO2);
			GSO2[0,] = null;
			}
		}

	}

void CheckMySignal(bool train_entered)
	{

	string[] track_params = new string[2];

	mainLib.LibraryCall("find_next_signal",track_params,GSO);

	if (((track_params[0])[0]=='+') or train_entered) {
		Cur_next = null;
	}
	LC.applaySignalState(me, Cur_next, Str.ToInt(track_params[1]), (track_params[0])[1]=='+');

	if (train_open) {
		while (
			Cur_next
			and (Cur_next.Type & ST_ROUTER)
			and Cur_next.train_open
			and (Cur_next.MainState != zxIndication.STATE_R)
			and (Cur_next.MainState != zxIndication.STATE_B)
			and (MainState != zxIndication.STATE_R)
			and (MainState != zxIndication.STATE_Rx)
			and (MainState != zxIndication.STATE_RWb)
		) {
			Cur_next.MainState = Cur_next.MainStateALS = zxIndication.STATE_B;
			Cur_next.SetSignal(true);

			mainLib.LibraryCall("find_next_signal",track_params,GSO);		// повторный поиск следующего сигнала, т.к. разделительный более не влияет

			if (((track_params[0])[0]=='+') or train_entered) {
				Cur_next = null;
			}
			LC.applaySignalState(me, Cur_next, Str.ToInt(track_params[1]), (track_params[0])[1]=='+');
		}
	}
	}


void MakeBUArrow()
	{

	if(!kor_BU_1 and !kor_BU_2 and kor_BU)
		{

		if(MU)
			SetFXAttachment("att1",null);

		else
			SetFXAttachment("att0",null);

		kor_BU = null;
		}
	else if(kor_BU_1)
		{
		kor_BU = new MeshObject[2];

		if(MU)
			kor_BU[0] = SetFXAttachment("att1",GetAsset().FindAsset("arrow1"));
		else
			kor_BU[0] = SetFXAttachment("att0",GetAsset().FindAsset("arrow1"));

		kor_BU[1] = kor_BU[0].SetFXAttachment("arrow0",GetAsset().FindAsset("arrow"));


		SetBUArrow(false);
		}

	else if(kor_BU_2)
		{
		kor_BU = new MeshObject[3];

		if(MU)
			kor_BU[0] = SetFXAttachment("att1",GetAsset().FindAsset("arrow2"));
		else
			kor_BU[0] = SetFXAttachment("att0",GetAsset().FindAsset("arrow2"));

		kor_BU[1] = kor_BU[0].SetFXAttachment("arrow0",GetAsset().FindAsset("arrow"));
		kor_BU[2] = kor_BU[0].SetFXAttachment("arrow1",GetAsset().FindAsset("arrow"));

		SetBUArrow(false);
		}
	}

void SetBUArrow(bool state)
	{
	kor_BU[1].SetMeshVisible("default",state,0.5);

	if(kor_BU.size()==3)
		kor_BU[2].SetMeshVisible("default",state,0.5);

	}



public void UpdateState(int reason, int priority)  	// обновление состояния светофора, основной кусок сигнального движка
	{				// reason : 0 - команда изменения состояния 1 - наезд поезда в направлении 2 - съезд поезда в направлении 3 - наезд поезда против 4 - съезд поезда против 5 - покидание зоны светофора поездом
 	inherited(reason,priority);

	if(!Inited or MP_NotServer)
		return;

	if(!(Type & ST_UNTYPED))
		return;

	if (reason == 0) {
		OldMainState = -1;
	}

	if(Type & ST_PROTECT and reason==0)
		{
		if(barrier_closed)
			{
			if(!pre_protected)
				{
				MainState = zxIndication.STATE_R;
				if (protect_influence) {
					MainStateALS = 0;
				}
				else {
					MainStateALS = 0;
				}
				SetSignalState(null, RED, "");
				}
			else
				{
				MainState = zxIndication.STATE_Y;
				SetSignalState(null, GREEN, "");
				}


			SetSignal(false);

			if(IsServer)
				mainLib.LibraryCall("mult_settings",null,GSO);

			if(!protect_influence)
				return;

			CheckPrevSignals(true);

			return;
			}
		else
			{
			SetSignalState(null, GREEN, "");

			if(!(Type & ST_UNLINKED) or x_mode)
				LC.applaySignalState(me, null, 0, false);
			else
				MainState = MainStateALS = 0;

			string[] track_params = new string[2];
				
			mainLib.LibraryCall("find_next_signal",track_params,GSO);

			if(Cur_next)
				Cur_next.CheckPrevSignals(false);

			
			SetSignal(false);

			if(IsServer)
				mainLib.LibraryCall("mult_settings",null,GSO);
			}
		}

	if((Type & ST_SHUNT) and train_open)
		{
		train_open = false;
		return;
		}


	if((Type & ST_UNLINKED) and !x_mode)
		{
		if(Type & (ST_IN+ST_OUT) )
			{
			if(reason==1 and (train_open or shunt_open))
				{
				train_open = false;
				shunt_open = false;
				MainState = zxIndication.STATE_R;
				MainStateALS = 0;
				SetSignalState(null, RED, "");
				SetSignal(false);
				CheckPrevSignals(false);

				if(IsServer)
					mainLib.LibraryCall("mult_settings",null,GSO);
				}
			if(reason==0)
				{
				if(!train_open and !shunt_open)
					{
					MainState = MainStateALS = zxIndication.STATE_R;
					SetSignalState(null, RED, "");
					CheckPrevSignals(false);
					SetSignal(false);

					if(IsServer)
						mainLib.LibraryCall("mult_settings",null,GSO);
					}
				else
					{
					if(shunt_open)
						{
						if(mainLib.LibraryCall("find_any_next_signal",null,GSO)=="true")
							{
							SetSignalState(null, GREEN, "");	
							MainState = MainStateALS = zxIndication.STATE_W;
							}
						else
							shunt_open = false;
						}
					else
						{
						SetSignalState(null, GREEN, "");

						string[] track_params = new string[2];
						mainLib.LibraryCall("find_next_signal",track_params,GSO);

						if(Cur_next)
							Cur_next.CheckPrevSignals(false);
						}	
					}
				}
			}

		}
	else if(reason==5)
		{
		if(shunt_open or prigl_open)
			{
			shunt_open = false;
			prigl_open = false;
			
			LC.applaySignalState(me, null, 0, false);

			SetSignal(true);
			ApplyNewSpeedLimit(-1);

			if(MainState == zxIndication.STATE_B)	// сброс белого может быть, когда пред. светофор уже открыт.
				{
				string[] track_params = new string[2];
				mainLib.LibraryCall("find_next_signal",track_params,GSO);

				if(Cur_next)
					Cur_next.CheckPrevSignals(false);
				}

			if(IsServer)
				mainLib.LibraryCall("mult_settings",null,GSO);
			}
		}


	else if(reason==0)
		{
		if(train_open and shunt_open)
			Interface.Exception("train didn't checked:"+train_open+" "+shunt_open);

		if(train_open and (Type & ST_ROUTER))			// запускаем маршрутный (с синим)
			{

			string[] track_params = new string[2];
			
			mainLib.LibraryCall("find_prev_signal",track_params,GSO);

			bool next_is_open = false;

			if(Cur_prev and Cur_prev.train_open
					and (Cur_prev.MainState != zxIndication.STATE_R)
					and (Cur_prev.MainState != zxIndication.STATE_Rx)
					and (Cur_prev.MainState != zxIndication.STATE_RWb))
				next_is_open = true;

			if((track_params[0])[0]=='+' or !next_is_open)
				{					// если перед светофором есть поезд или следующий закрыт, открываем в обычном порядке
				CheckMySignal(false);
				CheckPrevSignals(false);
				}
			else
				{
				MainState = MainStateALS = zxIndication.STATE_B;

				mainLib.LibraryCall("find_next_signal",track_params,GSO);

				if(Cur_next)
					Cur_next.CheckPrevSignals(false);
				}

			}
		else
			{
			if(shunt_open)
				{
				if(mainLib.LibraryCall("find_any_next_signal",null,GSO)!="true")
					{
					shunt_open = false;
					return;
					}
				}


			CheckMySignal(false);

			if(MainState == zxIndication.STATE_B)
				{
				string[] track_params = new string[2];
				
				mainLib.LibraryCall("find_next_signal",track_params,GSO);

				if(Cur_next and Cur_next.Inited)
					Cur_next.CheckPrevSignals(false);

				}
			else
				CheckPrevSignals(false);		// поиск следующего светофора
			}


		SetSignal(true);
		ApplyNewSpeedLimit(-1);	

		if(IsServer)
			mainLib.LibraryCall("mult_settings",null,GSO);
		}

	else if(reason==1 and (train_open or shunt_open or prigl_open or x_mode))
		{
		string[] type_ToFind = new string[2];


		if(priority < 0)
			priority = FindTrainPrior(false);

		type_ToFind[0]=priority;
		type_ToFind[1]="-";

		if((MainState != 0) and (MainState != zxIndication.STATE_B) and (!(Type & zxSignal.ST_UNLINKED) or x_mode))
			mainLib.LibraryCall("new_speed",type_ToFind,GSO);	// раньше, чем SetSignal()


		if(train_open or x_mode)
			{
			if(!(Type & ST_PERMOPENED) and !x_mode)
				train_open = false;

			CheckMySignal(true);
	
			SetSignal(true);

			if(IsServer)
				mainLib.LibraryCall("mult_settings",null,GSO);


			mainLib.LibraryCall("find_prev_signal",type_ToFind,GSO);

			

			}
		}

	else if(reason==2)
		{
		if( IsObligatory() )
			{
			CheckPrevSignals(false);
			}
		}



	if(Type & (ST_PERMOPENED+ST_IN) and !(Type & ST_UNLINKED) and MainState != zxIndication.STATE_Rx)
		{
		if(reason==3)
			CheckPrevSignals(true);
		else if(reason==4)
			{
			CheckMySignal(false);

			SetSignal(true);

			if(IsServer)
				mainLib.LibraryCall("mult_settings",null,GSO);
	
			}
		}
	}



public void UnlinkedUpdate(zxSignal nextSign)
	{

	if(MP_NotServer)
		return;

	if(Type & ST_PERMOPENED)
		{
		if(ex_sgn[zxIndication.STATE_R] or ex_sgn[zxIndication.STATE_Y])
			LC.applaySignalState(me, nextSign, 0, false);
		else if(ex_sgn[zxIndication.STATE_G])
			{		// является повторительным, т.к. имеет только зелёную линзу
			if (!nextSign or nextSign.MainState == 0 or nextSign.MainState == zxIndication.STATE_R or nextSign.MainState == zxIndication.STATE_Rx or nextSign.MainState == zxIndication.STATE_RWb or nextSign.MainState == zxIndication.STATE_W or nextSign.MainState == zxIndication.STATE_WW)
				MainState = 0;
			else
				MainState = zxIndication.STATE_G;

			}
		else
			MainState = 0;

		if (nextSign) {
			MainStateALS = nextSign.MainStateALS;
		}
		else {
			MainStateALS = 0;
		}

		SetSignal(false);

		if(IsServer)
			mainLib.LibraryCall("mult_settings",null,GSO);

		}
	else if(Type & (ST_IN+ST_OUT))
		{
		if(train_open)
			{
			if (nextSign) {
				MainState = nextSign.MainState;
				MainStateALS = nextSign.MainStateALS;
			}
			else {
				MainState = MainStateALS = 0;
			}
			SetSignalState(null, GREEN, "");
			SetSignal(false);

			if(IsServer)
				mainLib.LibraryCall("mult_settings",null,GSO);
			}
		}
	else
		{
		if (nextSign) {
			MainState = nextSign.MainState;
			MainStateALS = nextSign.MainStateALS;
		}
		else {
			MainState = MainStateALS = 0;
		}
		SetSignal(false);

		if(IsServer)
			mainLib.LibraryCall("mult_settings",null,GSO);
		}
	}




public void SetzxSpeedBoard(MapObject newSP)
	{
	if(!newSP)
		{
		zxSP=null;
		zxSP_name="";
		zxSP_id=null;
		return;
		}

	zxSP=cast<zxSpeedBoard>newSP;
	zxSP_name=zxSP.GetLocalisedName();
	zxSP_id=zxSP.GetGameObjectID();
	}


public void SetLinkedMU(Trackside MU2)
	{
	if(!MU2)
		{
		linkedMU=null;
		MU_name="";
		MU_id=null;
		return;
		}

	linkedMU=MU2;
	MU_name=linkedMU.GetLocalisedName();
	MU_id=linkedMU.GetGameObjectID();
	}


int GetCirillic(string s)		// для совместимости
	{
	return zxSymbolTranslator.GetCirillic(s);
	}

int GetArabic(int i, string s)
	{
	return zxSymbolTranslator.GetArabic(i, s);
	}

void GetRome(int i, string s, int[] result)
	{
	zxSymbolTranslator.GetRome(i, s, result);
	}





public void ShowName(bool reset)
{
	string[] name_str = new string[10];
	mainLib.LibraryCall("name_str",name_str,null);



	int[] tabl = new int[7];
	int n_tabl;
	int q=0;
	int i=0;


	string sv_name = privateName;


	int j = 0;
	int[] temp = new int[2];


	while(i<sv_name.size() and j<7)
		{

		tabl[j]=zxSymbolTranslator.GetArabic(i, sv_name);

		if(tabl[j]<0)
			{
			if(i<sv_name.size()-1)
				{
				string part=sv_name[i,i+2];
				tabl[j]=zxSymbolTranslator.GetCirillic(part);
				}

			if(tabl[j] < 0)
				{
				zxSymbolTranslator.GetRome(i, sv_name, temp);

				if(temp[0] >= 0)
					{
					tabl[j] = temp[0];
					i = i + temp[1];
					}
				else if(sv_name[i]==' ')
					{
					tabl[j] = 21;
					}
				else if(sv_name[i]=='-')
					{
					tabl[j] = 51;
					}
				else
					j--;
				}
			else
				i++;
			}

		j++;
		i++;
		}



	n_tabl = j;


	if(!isMacht and n_tabl>3)
		{
		while(tabl[q]<22 and q<n_tabl )
			q++;

		if(q < n_tabl)
			{
			while(q<n_tabl and tabl[q]>=22 )
				q++;

			if(q>(n_tabl-1) or q>3)
				q=3;

			}
		else
			q=3;
		}
	else
		q = n_tabl;



	if(reset)
		{
		if(isMacht)
			{
			for(i=0;i<7;i++)
				SetFXAttachment(name_str[i], null);
			}
		else
			{
			for(i=0;i<10;i++)
				SetFXAttachment(name_str[i], null);
			}
		}





	if(isMacht)
		{

		for(i=0;i<n_tabl;i++)
			{
			if(name_str[i] != "")
				{
				MeshObject MO = SetFXAttachment(name_str[i], tabl_m);
				MO.SetFXTextureReplacement("texture",tex,tabl[i]);
				}
			}
		}
	else if(q > 0)
		{

/*
ряды табичек


01234
56789
*/
		MeshObject MO;


		switch(q)
			{
			case 1:
				MO = SetFXAttachment(name_str[2], tabl_m);
				MO.SetFXTextureReplacement("texture",tex,tabl[0]);
				break;

			case 2:
				MO = SetFXAttachment(name_str[1], tabl_m);
				MO.SetFXTextureReplacement("texture",tex,tabl[0]);
				MO = SetFXAttachment(name_str[3], tabl_m);
				MO.SetFXTextureReplacement("texture",tex,tabl[1]);
				break;

			default:
			case 3:
				MO = SetFXAttachment(name_str[0], tabl_m);
				MO.SetFXTextureReplacement("texture",tex,tabl[0]);
				MO = SetFXAttachment(name_str[2], tabl_m);
				MO.SetFXTextureReplacement("texture",tex,tabl[1]);
				MO = SetFXAttachment(name_str[4], tabl_m);
				MO.SetFXTextureReplacement("texture",tex,tabl[2]);
				break;

			}


		int q1 = n_tabl - q;


		if(q1 > 0)
			{
			switch(q1)
				{
				case 1:
					MO = SetFXAttachment(name_str[7], tabl_m);
					MO.SetFXTextureReplacement("texture",tex,tabl[q]);
					break;

				case 2:
					MO = SetFXAttachment(name_str[6], tabl_m);
					MO.SetFXTextureReplacement("texture",tex,tabl[q]);
					MO = SetFXAttachment(name_str[8], tabl_m);
					MO.SetFXTextureReplacement("texture",tex,tabl[(q+1)]);
					break;

				default:
				case 3:
					MO = SetFXAttachment(name_str[5], tabl_m);
					MO.SetFXTextureReplacement("texture",tex,tabl[q]);
					MO = SetFXAttachment(name_str[7], tabl_m);
					MO.SetFXTextureReplacement("texture",tex,tabl[(q+1)]);
					MO = SetFXAttachment(name_str[9], tabl_m);
					MO.SetFXTextureReplacement("texture",tex,tabl[(q+2)]);
					break;

				}
			}
		}
}



public void Deswitch_span()
{

	int n = span_soup.GetNamedTagAsInt("Extra_sign",0);
	int i;

	GSObject[] GSO2=new GSObject[1];

	for(i=0;i<n;i++)
		{
		GameObjectID zxsId = span_soup.GetNamedTagAsGameObjectID("sub_sign_"+i);
		zxSignal zxs;
		
		if(zxsId and (zxs = cast<zxSignal>(Router.GetGameObject(zxsId))))
			{
			zxs.MainState = zxs.MainStateALS = zxIndication.STATE_Rx;
			zxs.wrong_dir = true;
			zxs.x_mode = false;
			zxs.stationName = stationName;
			zxs.SetSignal(true);

			if(IsServer)
				{
				GSO2[0] = cast<GSObject>zxs;
				mainLib.LibraryCall("mult_settings",null,GSO2);
				}
			}
		else
			Interface.Exception("Initiate span in signal "+privateName+"@"+stationName+": incorrect sub_sign "+span_soup.GetNamedTagAsGameObjectID("sub_sign_"+i).GetDebugString());
		}

	GSO2[0,] = null; 

	wrong_dir = true;

	if(n>0)
		{
		GameObjectID zxsId = span_soup.GetNamedTagAsGameObjectID("sub_sign_"+(n-1));
		zxSignal zxs = cast<zxSignal> (Router.GetGameObject(zxsId));
		zxs.CheckPrevSignals(false);
		}
	else
		CheckPrevSignals(false);


	if(SetOwnSignalState(true))
		NewSignal(set_lens,0,0.7);

	
	if(IsServer)
		mainLib.LibraryCall("mult_settings",null,GSO);

}


public bool Switch_span(bool obligatory)		// повернуть перегон в сторону этого светофора
{
	if(MP_NotServer)
		return true;


	if(!obligatory)
		{

		GSTrackSearch GSTS = me.BeginTrackSearch(false);
		MapObject MO = GSTS.SearchNext();

		bool temp_dir;
		while(MO and !( MO.isclass(zxSignal) and (GSTS.GetFacingRelativeToSearchDirection() == true) and (cast<zxSignal>MO).Type & ST_IN ) )
			{

			if( MO.isclass(Vehicle))
				{
				return false;
				}



			if(MO.isclass(Trackside) and !MO.isclass(Junction) and GSTS.GetDistance()>3000 )
				{
				temp_dir=GSTS.GetFacingRelativeToSearchDirection();
				GSTS = (cast<Trackside>MO).BeginTrackSearch(temp_dir);
				}
			MO = GSTS.SearchNext();
			}
		if(!MO)
			return false;
		}


	int n = span_soup.GetNamedTagAsInt("Extra_sign",0);
	int i;
	zxSignal zxs;


	if(obligatory)
		{
		for(i=0;i<n;i++)
			{
			GameObjectID zxsId = span_soup.GetNamedTagAsGameObjectID("sub_sign_"+i);
			if(zxsId and (zxs = cast<zxSignal> (Router.GetGameObject(zxsId))))
				{
				zxs.MainState = zxIndication.STATE_R;
				zxs.wrong_dir = false;
				zxs.x_mode = zxs.Type & ST_FLOAT_BLOCK;
				zxs.stationName = stationName;

				zxs.UpdateState(0, -1);
				}
			}
		}
	else
		{
		for(i=0;i<n;i++)
			{
			GameObjectID zxsId = span_soup.GetNamedTagAsGameObjectID("sub_sign_"+i);
			zxs;
			if(zxsId and (zxs = cast<zxSignal> (Router.GetGameObject(zxsId))))
				{
				zxs.MainState = zxIndication.STATE_R;
				zxs.wrong_dir = false;
				zxs.x_mode = zxs.Type & ST_FLOAT_BLOCK;
				zxs.stationName = stationName;
				}
			else
				Interface.Exception("Initiate span in signal "+privateName+"@"+stationName+": incorrect sub_sign "+span_soup.GetNamedTagAsGameObjectID("sub_sign_"+i).GetDebugString());
			}

		}


	GameObjectID zxsmId = span_soup.GetNamedTagAsGameObjectID("end_sign");
	zxSignal_main zxsm;
	if (zxsmId) {
		zxsm = cast<zxSignal_main> (Router.GetGameObject(zxsmId));
	}

	if(!zxsm)
		Interface.Exception("Initiate span in signal "+privateName+"@"+stationName+": incorrect end_sign "+span_soup.GetNamedTagAsGameObjectID("end_sign").GetDebugString());


	zxsm.Deswitch_span();

	wrong_dir=false;

	UpdateState(0, -1);

	mainLib.LibraryCall("span_dir_changed",null,GSO);


	if(IsServer)
		mainLib.LibraryCall("mult_settings",null,GSO);

	return true;
}







public void Switch_span2()		// повернуть светофор в сторону этого светофора
{
	Switch_span(true);
}


public void SetPredvhod()
	{
	if(isMacht)
		{
		if(predvhod)
			{
			Asset predvhod=GetAsset().FindAsset("predvhod");
			SetFXAttachment("att1", predvhod);
			}
		else
			SetFXAttachment("att1", null);
		}
	}


public void GenerateSpan(bool recurs)
{
	if(!(Type & ST_IN))
		return;

	span_soup= Constructors.NewSoup();

	GSTrackSearch GSTS = me.BeginTrackSearch(false);
	MapObject MO = GSTS.SearchNext();
	MapObject TempMO = null;
	bool temp_dir;

	int Extra_sign=0;
	while(MO and !( MO.isclass(zxSignal) and (cast<zxSignal>MO).Type & ST_IN ) )
		{

		if( MO.isclass(zxSignal)  and ((cast<zxSignal>MO).Type & ST_PERMOPENED )   and !((cast<zxSignal>MO).Type & ST_UNLINKED ))
			{
			if(GSTS.GetFacingRelativeToSearchDirection() == false)
				{
				span_soup.SetNamedTag("sub_sign_"+Extra_sign,MO.GetGameObjectID());
				(cast<zxSignal_main>MO).stationName = stationName;
				if((cast<zxSignal_main>MO).predvhod)
					{
					(cast<zxSignal_main>MO).predvhod = false;
					(cast<zxSignal_main>MO).SetPredvhod();
					}
				if(!TempMO)
					TempMO = MO;

				Extra_sign++;
				}
			}



		if(MO.isclass(Trackside) and !MO.isclass(Junction) and GSTS.GetDistance()>3000 )
			{
			temp_dir=GSTS.GetFacingRelativeToSearchDirection();
			GSTS = (cast<Trackside>MO).BeginTrackSearch(temp_dir);
			}
		MO = GSTS.SearchNext();
		}
	if(!MO or !GSTS.GetFacingRelativeToSearchDirection())
		return;

	if(TempMO)
		{
		(cast<zxSignal_main>TempMO).predvhod = true;
		(cast<zxSignal_main>TempMO).SetPredvhod();
		}
	zxSignal_main zx_oth = cast<zxSignal_main>MO;

	span_soup.SetNamedTag("Extra_sign",Extra_sign);

	span_soup.SetNamedTag("end_sign",MO.GetGameObjectID());
	span_soup.SetNamedTag("end_sign_n",zx_oth.privateName);
	span_soup.SetNamedTag("end_sign_s",zx_oth.stationName);

	if(recurs)
		{
		zx_oth.GenerateSpan(false);
		span_soup.SetNamedTag("Inited",true);

		Switch_span(true);
		}
	else
		span_soup.SetNamedTag("Inited",true);
}




public int GetALSNCode(void)
	{
//	if(barrier_closed and protect_influence)
//		return CODE_NONE;

//	if (x_mode and RCCount < distanceRY) {
//		return CODE_NONE;
//	}
	if( MainStateALS == zxIndication.STATE_R or MainStateALS == zxIndication.STATE_RWb or ( (MainStateALS == zxIndication.STATE_W or MainStateALS == zxIndication.STATE_WW ) and Type&(ST_IN+ST_OUT+ST_ROUTER) ) )
		return CODE_REDYELLOW;
	else if( (MainStateALS >= zxIndication.STATE_YY and MainStateALS <= zxIndication.STATE_YbY) or MainStateALS == zxIndication.STATE_YYY or MainStateALS == zxIndication.STATE_YW or MainStateALS == zxIndication.STATE_YbW or MainStateALS == zxIndication.STATE_YYW or MainStateALS == zxIndication.STATE_YbYW)
		return CODE_YELLOW;
	else if(yellow_code and (MainStateALS == zxIndication.STATE_GY or MainStateALS == zxIndication.STATE_Yb) )
		return CODE_YELLOW;		
	else if(MainStateALS >= zxIndication.STATE_GY and MainStateALS != zxIndication.STATE_B)
		return CODE_GREEN;

	if(MainStateALS == zxIndication.STATE_B)	
		return CODE_YELLOW;

	return CODE_NONE;
	}



public int GetALSNTypeSignal(void)
	{
	if((Type & ST_UNTYPED) == 0 or MainState == zxIndication.STATE_B)
		return TYPE_NONE;
	
	if(barrier_closed and protect_influence)
		return TYPE_CIRCUIT;


	int type1 = TYPE_NONE;

	if(Type & ST_IN)
		type1 = type1 | TYPE_IN;

	if(Type & ST_OUT)
		type1 = type1 | TYPE_OUT;

	if(Type & ST_ROUTER)
		type1 = type1 | TYPE_DIVIDE;

	if (x_mode)
		type1 = type1 | TYPE_CIRCUIT;

	if(type1 == TYPE_NONE and Type & ST_UNLINKED)
		return TYPE_NONE;

	if(Type & ST_PERMOPENED)
		type1 = type1 | TYPE_PASSING;

	if (Type & (ST_IN | ST_OUT | ST_ROUTER | ST_SHUNT))
		type1 = type1 | 128; //Новый флаг TYPE_SIDINGBRAKE для реализации провайдера для ТРС2019+

	return type1;
	}


public int GetALSNFrequency(void)
	{
	return code_freq;
	} 
  
public int GetALSNSiding(void)
	{
	return code_dev;
	}

public string GetALSNSignalName()
	{
	return privateName;
	} 

public string GetALSNStationName()
	{
	if( Type & ST_PERMOPENED )
		return "";
	return stationName;
	}



string TranslNames(string name)
	{
	string ret="";
	string main1= STT.GetString("lens_str1");
	string add1= STT.GetString("lens_str2");

	int i;

	for(i=name.size()-1;i>=0;i--)
		{
		if(name[i]=='R')
			ret="-"+main1[0,2]+ret;
		else if(name[i]=='G')
			ret="-"+main1[2,4]+ret;
		else if(name[i]=='Y')
			ret="-"+main1[6,8]+ret;
		else if(name[i]=='W')
			ret="-"+main1[12,14]+ret;
		else if(name[i]=='B')
			ret="-"+main1[16,18]+ret;
		else if(name[i]=='L')
			ret="-"+main1[2,4]+main1[18,20]+ret;
		else if(name[i]=='b')
			ret=add1+ret;
		else
			ret="-"+name[i,i+1]+ret;

		}

	ret = ret[1,];

	return ret;
	}

public string GetCntFloatBlockTable(void) {
	GSTrackSearch ts = BeginTrackSearch(true);
	zxSignal[] sigs = new zxSignal[0];
	sigs[0] = me;
	int[] distances = new int[0];
	distances[0] = 0;
	int i = 0;
	while (i <= distanceG) {
		if (!ts.SearchNextObject()) {
			break;
		}
		if (!ts.GetFacingRelativeToSearchDirection()) {
			continue;
		}
		zxSignal tmp = cast<zxSignal>ts.GetObject();
		if (!tmp or !(tmp.Type & (ST_IN | ST_OUT | ST_ROUTER | ST_PERMOPENED | ST_FLOAT_BLOCK))) {
			continue;
		}
		++i;
		sigs[i] = tmp;
		distances[i] = ts.GetDistance();
		if (!(tmp.Type & ST_FLOAT_BLOCK)) {
			break;
		}
	}
	
	HTMLWindow hw = HTMLWindow;
	string s = hw.StartTable("border='1' width='90%'");
	s = s + hw.StartRow();
	s = s + hw.StartCell("bgcolor='#00AA00'");
	s = s + hw.StartTable("border='0' width='100%'");
	s = s + hw.StartRow();
	s = s + hw.StartCell("bgcolor='#444444'");
	s = s + hw.StartTable("border='1' width='100%'");
	s = s + hw.StartRow();
	s = s + hw.StartCell("bgcolor='#999999'");
	s = s + STT.GetString("als_code");
	s = s + hw.EndCell();
	s = s + hw.StartCell("bgcolor='#999999'");
	s = s + STT.GetString("als_rc_count");
	s = s + hw.EndCell();
	s = s + hw.StartCell("bgcolor='#999999'");
	s = s + STT.GetString("als_distance");
	s = s + hw.EndCell();
	s = s + hw.EndRow();
	s = s + hw.StartRow();
	s = s + hw.StartCell("bgcolor='#888888'");
	s = s + STT.GetString("als_ry");
	s = s + hw.EndCell();
	s = s + hw.StartCell("bgcolor='#888888'");
	s = s + hw.MakeLink("live://property/distanceRY", distanceRY);
	s = s + hw.EndCell();
	s = s + hw.StartCell("bgcolor='#888888'");
	s = s + "<font color='#AAAAAA'>";
	if (i >= distanceRY - 1 and distanceRY > 0) {
		s = s + distances[distanceRY - 1] + "m (" + hw.MakeLink("live://property/distanceRY_d", sigs[distanceRY - 1].GetLocalisedName()) + ")";
	}
	else {
		s = s + "??m";
	}
	s = s + "</font> | ";
	if (i >= distanceRY) {
		s = s + distances[distanceRY] + "m (" + sigs[distanceRY].GetLocalisedName() + ")";
	}
	else {
		s = s + "??m";
	}
	s = s + " | <font color='#AAAAAA'>";
	if (i >= distanceRY + 1) {
		s = s + distances[distanceRY + 1] + "m (" + hw.MakeLink("live://property/distanceRY_u", sigs[distanceRY + 1].GetLocalisedName()) + ")";
	}
	else {
		s = s + "??m";
	}
	s = s + "</font>";
	s = s + hw.EndCell();
	s = s + hw.EndRow();
	s = s + hw.StartRow();
	s = s + hw.StartCell("bgcolor='#888888'");
	s = s + STT.GetString("als_y");
	s = s + hw.EndCell();
	s = s + hw.StartCell("bgcolor='#888888'");
	s = s + hw.MakeLink("live://property/distanceY", distanceY);
	s = s + hw.EndCell();
	s = s + hw.StartCell("bgcolor='#888888'");
	s = s + "<font color='#AAAAAA'>";
	if (i >= distanceY - 1 and distanceY > 0) {
		s = s + distances[distanceY - 1] + "m (" + hw.MakeLink("live://property/distanceY_d", sigs[distanceY - 1].GetLocalisedName()) + ")";
	}
	else {
		s = s + "??m";
	}
	s = s + "</font> | ";
	if (i >= distanceY) {
		s = s + distances[distanceY] + "m (" + sigs[distanceY].GetLocalisedName() + ")";
	}
	else {
		s = s + "??m";
	}
	s = s + " | <font color='#AAAAAA'>";
	if (i >= distanceY + 1) {
		s = s + distances[distanceY + 1] + "m (" + hw.MakeLink("live://property/distanceY_u", sigs[distanceY + 1].GetLocalisedName()) + ")";
	}
	else {
		s = s + "??m";
	}
	s = s + "</font>";
	s = s + hw.EndCell();
	s = s + hw.EndRow();
	s = s + hw.StartRow();
	s = s + hw.StartCell("bgcolor='#888888'");
	s = s + STT.GetString("als_g");
	s = s + hw.EndCell();
	s = s + hw.StartCell("bgcolor='#888888'");
	s = s + hw.MakeLink("live://property/distanceG", distanceG);
	s = s + hw.EndCell();
	s = s + hw.StartCell("bgcolor='#888888'");
	s = s + "<font color='#AAAAAA'>";
	if (i >= distanceG - 1 and distanceG > 0) {
		s = s + distances[distanceG - 1] + "m (" + hw.MakeLink("live://property/distanceG_d", sigs[distanceG - 1].GetLocalisedName()) + ")";
	}
	else {
		s = s + "??m";
	}
	s = s + "</font> | ";
	if (i >= distanceG) {
		s = s + distances[distanceG] + "m (" + sigs[distanceG].GetLocalisedName() + ")";
	}
	else {
		s = s + "??m";
	}
	s = s + " | <font color='#AAAAAA'>";
	if (i >= distanceG + 1) {
		s = s + distances[distanceG + 1] + "m (" + hw.MakeLink("live://property/distanceG_u", sigs[distanceG + 1].GetLocalisedName()) + ")";
	}
	else {
		s = s + "??m";
	}
	s = s + "</font>";
	s = s + hw.EndCell();
	s = s + hw.EndRow();
	s = s + hw.EndTable();
	s = s + hw.EndCell();
	s = s + hw.EndRow();
	s = s + hw.EndTable();
	s = s + hw.EndCell();
	s = s + hw.EndRow();
	s = s + hw.EndTable();

	return s;
}


public string GetCntSpeedTable(void)
{
 	string s="";
 	HTMLWindow hw=HTMLWindow;
        s=s+hw.StartTable("border='1' width='90%'");
        s=s+hw.StartRow();
	s=s+hw.StartCell("bgcolor='#00AA00'");

	        s=s+hw.StartTable("border='0' width='100%'");
        	s=s+hw.StartRow();
		s=s+hw.StartCell("bgcolor='#444444'");

		        s=s+hw.StartTable("border='1' width='100%'");
		        		s=s+hw.StartRow();
					s=s+hw.StartCell("bgcolor='#999999'");
					s=s+STT.GetString("sign_indication");
					s=s+hw.EndCell();

					s=s+hw.StartCell("bgcolor='#999999'");
					s=s+STT.GetString("pass_train");
					s=s+hw.EndCell();
					s=s+hw.StartCell("bgcolor='#999999'");
					s=s+STT.GetString("cargo_train");;
					s=s+hw.EndCell();

					s=s+hw.EndRow();

					int i;
					for (i = 0; i < 26; ++i) {
						if (
							(
								ex_sgn[i]
								and (i != zxIndication.STATE_GY or ab4)
								and i != zxIndication.STATE_B
							)
							or (
								(Type & ST_FLOAT_BLOCK)
								and (
									zxIndication.STATE_R == i
									or zxIndication.STATE_Y == i
									or zxIndication.STATE_G == i
								)
							)
						) {

		        		s=s+hw.StartRow();
					s=s+hw.StartCell("bgcolor='#888888'");


					s=s+TranslNames( LC.sgn_st[i].l.name);

					s=s+hw.EndCell();

					s=s+hw.StartCell("bgcolor='#888888'");
					s=s+hw.MakeLink("live://property/speed/p/"+i,  speed_soup.GetNamedTagAsInt("p"+i));
					s=s+hw.EndCell();
					s=s+hw.StartCell("bgcolor='#888888'");
					s=s+hw.MakeLink("live://property/speed/c/"+i, speed_soup.GetNamedTagAsInt("c"+i));
					s=s+hw.EndCell();

					s=s+hw.EndRow();
					}
				}

			s=s+hw.StartRow();
				s=s+hw.MakeCell(   hw.MakeLink("live://property/speed_init",STT.GetString("str_speed_init")),"bgcolor='#888888'");
				s=s+hw.MakeCell(   hw.MakeLink("live://property/speed_copy",STT.GetString("str_speed_copy")),"bgcolor='#888888'");
				s=s+hw.MakeCell(   hw.MakeLink("live://property/speed_paste",STT.GetString("str_speed_paste")),"bgcolor='#888888'");
			s=s+hw.EndRow();
			s=s+hw.EndTable();

		s=s+hw.EndCell();
		s=s+hw.EndRow();
		s=s+hw.EndTable();

	s=s+hw.EndCell();
	s=s+hw.EndRow();
	s=s+hw.EndTable();

 	return s;
 }






public string GetExtraSetTable()
{
	HTMLWindow hw=HTMLWindow;
	string s="";



       s=s+hw.StartTable("border='1' width='90%'");


	s=s+hw.StartRow();
	s=s+hw.MakeCell(hw.MakeLink("live://property/displace",  STT.GetString("displace")),"bgcolor='#666666' colspan='6'");
	s=s+hw.MakeCell(hw.MakeLink("live://property/displace",   displacement ),"bgcolor='#AAAAAA'  align='center' ");
	s=s+hw.EndRow();



	s=s+hw.StartRow();
	s=s+hw.MakeCell(hw.MakeLink("live://property/displace1/-3.2", "-3.2" ),"bgcolor='#BBAAAA' align='center'");
	s=s+hw.MakeCell(hw.MakeLink("live://property/displace1/-2.65", "-2.65" ),"bgcolor='#BBAAAA' align='center'");
	s=s+hw.MakeCell(hw.MakeLink("live://property/displace1/-2.5", "-2.5" ),"bgcolor='#BBAAAA' align='center'");
	s=s+hw.MakeCell(hw.MakeLink("live://property/displace1/2.5", "2.5" ),"bgcolor='#BBAAAA' align='center'");
	s=s+hw.MakeCell(hw.MakeLink("live://property/displace1/2.65", "2.65" ),"bgcolor='#BBAAAA' align='center'");
	s=s+hw.MakeCell(hw.MakeLink("live://property/displace1/2.85", "2.85" ),"bgcolor='#BBAAAA' align='center'");
	s=s+hw.MakeCell(hw.MakeLink("live://property/displace1/3.2", "3.2" ),"bgcolor='#BBAAAA' align='center'");

	s=s+hw.EndRow();


	s=s+hw.EndTable();


	s=s+"<br>";


	s=s+hw.StartTable("border='1' width=90%");

	s=s+hw.StartRow();
	s=s+hw.MakeCell(hw.MakeLink("live://property/vert_displ",  STT.GetString("vert_displ")),"bgcolor='#666666'");
	s=s+hw.MakeCell(hw.MakeLink("live://property/vert_displ",   vert_displ ),"bgcolor='#AAAAAA'  align='center' ");
	s=s+hw.EndRow();


	s=s+hw.StartRow();
	s=s+hw.MakeCell(hw.MakeLink("live://property/along_displ",  STT.GetString("along_displ")),"bgcolor='#666666'");
	s=s+hw.MakeCell(hw.MakeLink("live://property/along_displ",   along_displ ),"bgcolor='#AAAAAA'  align='center' ");
	s=s+hw.EndRow();


	if(isMacht)
		{
		s=s+hw.StartRow();
		s=s+hw.MakeCell(hw.MakeLink("live://property/head_rot",  STT.GetString("head_rot")),"bgcolor='#666666'");
		s=s+hw.MakeCell(hw.MakeLink("live://property/head_rot",   (int)(head_rot/DegToRad) ),"bgcolor='#AAAAAA'  align='center' ");
		s=s+hw.EndRow();

		s=s+hw.StartRow();
		s=s+hw.MakeCell(hw.MakeLink("live://property/head_krepl_rot",  STT.GetString("head_krep")),"bgcolor='#666666'");
		s=s+hw.MakeCell(hw.MakeLink("live://property/head_krepl_rot",   (int)(head_krepl_rot/DegToRad) ),"bgcolor='#AAAAAA'  align='center' ");
		s=s+hw.EndRow();
		}


	s=s+hw.EndTable();
	s=s+"<br>";


	s=s+hw.StartTable("border='1' width='90%'");

	s=s+hw.StartRow();
	s=s+hw.MakeCell(hw.MakeLink("live://property/pause_bef_red",  STT.GetString("pause_bef_red")),"bgcolor='#666666'");
	s=s+hw.MakeCell(hw.MakeLink("live://property/pause_bef_red",   pause_bef_red ),"bgcolor='#AAAAAA'  align='center' ");
	s=s+hw.EndRow();

	s=s+hw.EndTable();
	s=s+"<br>";




	return s;
}


string ConvLensKit(string s);



string MakeCheckBoxRow(string link1,string deskr, bool value)
{
	HTMLWindow hw=HTMLWindow;

	string s=hw.StartRow();
 	s=s+hw.StartCell("bgcolor='#888888'");
 	s=s+hw.CheckBox(link1,value);
 	s=s+" "+hw.MakeLink(link1, deskr);
 	s=s+hw.EndCell();
	s=s+hw.EndRow();

	return s;
}



string MakeCheckBoxCell(string link1,string deskr, bool value)
{
	HTMLWindow hw=HTMLWindow;

	string s=hw.StartCell("bgcolor='#888888'");
 	s=s+hw.CheckBox(link1,value);
 	s=s+" "+hw.MakeLink(link1, deskr);
 	s=s+hw.EndCell();

	return s;
}



string MakeRadioButtonCell(string link1,string deskr, bool value)
{
	HTMLWindow hw=HTMLWindow;

 	string s=hw.StartCell("bgcolor='#888888'");
 	s=s+hw.RadioButton(link1,value);
 	s=s+" "+hw.MakeLink(link1, deskr);
 	s=s+hw.EndCell();

	return s;
}




public string GetProtectTable()
{
	HTMLWindow hw=HTMLWindow;
	string s="";


	s=s+hw.StartRow();
	s=s+hw.MakeCell( hw.MakeLink("live://property/protect_name",  STT.GetString("protect_name")),"bgcolor='#886666'");
	s=s+hw.MakeCell( hw.MakeLink("live://property/protect_name",ProtectGroup),"bgcolor='#BBAAAA'");
	s=s+hw.MakeCell( hw.MakeLink("live://property/protect_delete", "X"),"align='center' bgcolor='#BBAAAA' width='5%' ");
	s=s+hw.EndRow();

	int N = 0;
	int i;

	if(protect_soup)
		N = protect_soup.GetNamedTagAsInt("number",0);

	for(i=0;i<N;i++)
		{
		zxSignal TMP = cast<zxSignal>(Router.GetGameObject(protect_soup.GetNamedTagAsGameObjectID(i+"")));

		if(TMP)
	       		s=s+hw.MakeRow(
					hw.MakeCell(TMP.privateName,"colspan=2")+
					hw.MakeCell(hw.MakeLink("live://property/remove_protect_sign/"+i,"X"),"align='center' width='5%'")       		
		       			,"bgcolor=#888888"
	       			);

      		}



	s=s+hw.StartRow();
	s=s+hw.MakeCell( hw.MakeLink("live://property/protect_create",  STT.GetString("des_protectcreate")),"bgcolor='#886666' colspan=3");
	s=s+hw.EndRow();

	s=s+hw.StartRow();
	s=s+MakeCheckBoxCell("live://property/protect_influence",STT.GetString("protect_influence"), protect_influence)+hw.MakeCell("","bgcolor='#888888'  colspan=2");
	s=s+hw.EndRow();

	s=hw.MakeTable(s,"width=100%");
        s=hw.MakeTable(hw.MakeRow(hw.MakeCell(s),"bgcolor=#00FFFF"),"width=90%");


	return s;
}



public string GetDescriptionHTML(void)
{

	HTMLWindow hw=HTMLWindow;

	station_edited = true;

 	string s="";
        s=s+"<html><body>";

        s=s+"<font size=7 color='#00EFBF'><b>"+ST.GetString("object_desc")+"</b></font><br>";

        s=s+hw.StartTable("border='1' width=90%");
        s=s+hw.StartRow();
	s=s+hw.StartCell("bgcolor='#666666'");
	s=s+hw.MakeLink("live://property/private-name",  STT.GetString("private_name"));
      	s=s+hw.EndCell();
       	s=s+hw.StartCell("bgcolor='#AAAAAA', align='right'");
       	s=s+hw.MakeLink("live://property/private-name",privateName);
       	s=s+hw.EndCell();
	s=s+hw.EndRow();


//	if( !(Type & ST_PERMOPENED) )
		{
	        s=s+hw.StartRow();
		s=s+hw.MakeCell( hw.MakeLink("live://property/station_name",  STT.GetString("station_name")),"bgcolor='#886666'");
		s=s+hw.MakeCell( hw.MakeLink("live://property/station_name",stationName),"bgcolor='#BBAAAA'");
		s=s+hw.MakeCell( hw.MakeLink("live://property/station_delete", "X"));
		s=s+hw.EndRow();

		s=s+hw.StartRow();
		s=s+hw.MakeCell( hw.MakeLink("live://property/station_create",  STT.GetString("add_station_name")),"bgcolor='#886666'");
		s=s+hw.MakeCell( mainLib.LibraryCall("station_count",null,null),"bgcolor='#BBAAAA' align='right'");
		s=s+hw.EndRow();
		}

	s=s+hw.EndTable();

	s=s+"<br>";

// розжиг



	string ab_str = "ab3";
	if(ab4)
		ab_str = "ab4";


        s=s+hw.StartTable("border='1' width=90%");


	s=s+hw.StartRow();
	s=s+hw.MakeCell(hw.MakeLink("live://property/lens_kit_ex",  STT.GetString("lens_kit")),"bgcolor='#666666'");
	s=s+hw.MakeCell(hw.MakeLink("live://property/lens_kit",  ConvLensKit( lens_kit )  ),"bgcolor='#BBAAAA'");
	s=s+hw.EndRow();


	s=s+hw.StartRow();
	s=s+hw.MakeCell( hw.MakeLink("live://property/abtype", STT.GetString("abtype") ) ,"bgcolor='#666666'");
	s=s+hw.MakeCell( hw.MakeLink("live://property/abtype", STT.GetString(ab_str) ) ,"bgcolor='#AAAAAA'");
	s=s+hw.EndRow();


	s=s+hw.EndTable();



	if(ex_sgn[zxIndication.STATE_R] and ex_sgn[zxIndication.STATE_W])		// только у светофоров с красным и белым немигающим
		{
		s=s+hw.StartTable("border='1' width=90%");

		s=s+hw.StartRow();	
		s=s+hw.StartCell("bgcolor='#666666' align='left'");

		s=s+hw.CheckBox("live://property/prigl_enabled", prigl_enabled);
	 	s=s+" "+hw.MakeLink("live://property/prigl_enabled", STT.GetString("prigl_enabled"));

		s=s+hw.EndCell();
		s=s+hw.EndRow();

		s=s+hw.EndTable();
		}



	s=s+"<br>";



	if(Type & (ST_IN+ST_OUT+ST_ROUTER))	// станционный светофор
		{

		s=s+hw.StartTable("border='1' width=90%");

		s=s+hw.StartRow();
		s=s+hw.MakeCell(hw.MakeLink("live://property/priority", STT.GetString("priority")   ),"bgcolor='#666666' colspan='6'");
		s=s+hw.MakeCell(hw.MakeLink("live://property/priority",   def_path_priority ),"bgcolor='#AAAAAA'  align='center' ");
		s=s+hw.EndRow();

		s=s+hw.EndTable();
		s=s+"<br>";


		}

	if( isMacht and (!(Type & ST_UNLINKED) or (Type & ST_FLOAT_BLOCK)))
		{

		s=s+hw.StartTable("border='1' width=90%");

		s=s+hw.StartRow();
		s=s+MakeRadioButtonCell("live://property/kor_BU_1",STT.GetString("kor_BU_1"), kor_BU_1);
		s=s+hw.EndRow();
		s=s+hw.StartRow();
		s=s+MakeRadioButtonCell("live://property/kor_BU_2",STT.GetString("kor_BU_2"), kor_BU_2);
		s=s+hw.EndRow();

	        s=s+MakeCheckBoxRow("live://property/MU",STT.GetString("MU"), MU != null);


		if(MU)
			{
			s=s+hw.StartRow();
			s=s+hw.StartCell();
			s=s+hw.StartTable("border='1' width=90%");


			s=s+hw.StartRow();
			s=s+hw.StartCell();
			s=s+" ";
			s=s+hw.EndCell();
			s=s+hw.EndRow();


			s=s+hw.StartRow();
			s=s+hw.StartCell("bgcolor='#888888'");
			s=s+hw.MakeLink("live://property/color_rsign",STT.GetString("color_rsign_desc"));
			s=s+hw.EndCell();
			s=s+hw.StartCell("bgcolor='#AAAAAA'");


			string texAssetName=STT.GetString("color_rsign_"+MU.textureName);
			s=s+hw.MakeLink("live://property/color_rsign",texAssetName );
			s=s+hw.EndCell();
			s=s+hw.EndRow();


			s=s+hw.StartRow();
			s=s+hw.StartCell("bgcolor='#888888'");
			s=s+hw.MakeLink("live://property/type_matrix",STT.GetString("type_matrix"));
			s=s+hw.EndCell();
			s=s+hw.StartCell("bgcolor='#AAAAAA'");
			string ctrlMatrix=STT.GetString("typematrix_"+MU.typeMatrix);
			s=s+hw.MakeLink("live://property/type_matrix",ctrlMatrix );
			s=s+hw.EndCell();
			s=s+hw.EndRow();


			s=s+hw.StartRow();
			s=s+hw.StartCell("bgcolor='#888888'");
			s=s+hw.MakeLink("live://property/twait",STT.GetString("twait"));
			s=s+hw.EndCell();
			s=s+hw.StartCell("bgcolor='#AAAAAA'");
			s=s+hw.MakeLink("live://property/twait",MU.timeToWait );
			s=s+hw.EndCell();
			s=s+hw.EndRow();

			s=s+hw.EndTable();
			s=s+hw.EndCell();
			s=s+hw.EndRow();
			}


		s=s+hw.EndTable();
		}



	s=s+"<br>";


	s=s+hw.StartTable("border='1' width=90%");

	s=s+hw.StartRow();
	s=s+hw.MakeCell(STT.GetString("ALS"),"bgcolor='#AAAAAA' colspan='2' ");


	if(Type & (ST_IN | ST_OUT | ST_ROUTER))
		s=s+hw.StartCell("bgcolor='#886666' colspan='3' align='center' ") + "  ";
	else 
		s=s+hw.StartCell("bgcolor='#886666' colspan='2' align='center' ") + "  ";
	s=s+hw.EndCell();


	s=s+hw.StartCell("bgcolor='#886666'");
	s=s+hw.CheckBox("live://property/saut_equipped",saut_eq);
	s=s+" "+hw.MakeLink("live://property/saut_equipped", STT.GetString("SAUT"));
	s=s+hw.EndCell();


	s=s+hw.EndRow();


	s=s+hw.StartRow();
	s=s+MakeRadioButtonCell("live://property/code_freq/0",STT.GetString("uncoded"), code_freq==0);
	s=s+MakeRadioButtonCell("live://property/code_freq/1",STT.GetString("ALS25"), code_freq & 1);
	s=s+MakeRadioButtonCell("live://property/code_freq/2",STT.GetString("ALS50"), code_freq & 2);

	if(Type & (ST_IN | ST_OUT | ST_ROUTER))
		{
		s=s+hw.StartCell("bgcolor='#888888' colspan='2'");
		s=s+hw.RadioButton("live://property/code_freq/4", code_freq & 4);
		s=s+" "+hw.MakeLink("live://property/code_freq/4", STT.GetString("ALS75"));
		s=s+hw.EndCell();
		}
	else
		s=s+MakeRadioButtonCell("live://property/code_freq/4",STT.GetString("ALS75"), code_freq & 4);


	s=s+MakeCheckBoxCell("live://property/code_freq/8",STT.GetString("ALSEN"), code_freq & 8);
	s=s+hw.EndRow();

	int column_number = 5;


	if(Type & (ST_IN | ST_OUT | ST_ROUTER))
		{
		column_number++;
		s=s+hw.StartRow();
		s=s+hw.MakeCell(STT.GetString("code_dev"),"bgcolor='#AAAAAA' colspan='2' ");

		s=s+hw.StartCell("bgcolor='#888888' colspan='2'");
		s=s+hw.CheckBox("live://property/code_dev/1", code_dev & 1);
		s=s+" "+hw.MakeLink("live://property/code_dev/1", STT.GetString("code_dev_t"));
		s=s+hw.EndCell();

		s=s+hw.StartCell("bgcolor='#888888' colspan='2'");
		s=s+hw.CheckBox("live://property/code_dev/2", code_dev & 2);
		s=s+" "+hw.MakeLink("live://property/code_dev/2", STT.GetString("code_dev_f"));
		s=s+hw.EndCell();
		s=s+hw.EndRow();
		}

	
	s=s+hw.StartRow();	
	s=s+hw.StartCell("bgcolor='#888888' colspan='"+column_number+"' align='left'");

	s=s+hw.CheckBox("live://property/yellow_code", yellow_code);
	 s=s+" "+hw.MakeLink("live://property/yellow_code", STT.GetString("yellow_code"));

	s=s+hw.EndCell();
	s=s+hw.EndRow();

	s=s+hw.EndTable();

	s=s+"<br>";


 	s=s+hw.StartTable("border='1' width=90%");

 	s=s+MakeCheckBoxRow("live://property/type/UNTYPED",STT.GetString("UNTYPED_flag"), Type & ST_UNTYPED);
 	s=s+MakeCheckBoxRow("live://property/type/IN",STT.GetString("IN_flag"), Type & ST_IN);
 	s=s+MakeCheckBoxRow("live://property/type/OUT",STT.GetString("OUT_flag"), Type & ST_OUT);
 	s=s+MakeCheckBoxRow("live://property/type/ROUTER",STT.GetString("ROUTER_flag"), Type & ST_ROUTER);
 	s=s+MakeCheckBoxRow("live://property/type/UNLINKED",STT.GetString("UNLINKED_flag"), Type & ST_UNLINKED);
 	s=s+MakeCheckBoxRow("live://property/type/PERMOPENED",STT.GetString("PERMOPENED_flag"), Type & ST_PERMOPENED);
 	s=s+MakeCheckBoxRow("live://property/type/SHUNT",STT.GetString("SHUNT_flag"), Type & ST_SHUNT);
 	s=s+MakeCheckBoxRow("live://property/type/ZAGRAD",STT.GetString("ZAGRAD_flag"), Type & ST_PROTECT);
 	s=s+MakeCheckBoxRow("live://property/type/FLOAT",STT.GetString("FLOAT_flag"), Type & ST_FLOAT_BLOCK);

	s=s+hw.EndTable();


	if(Type & ST_IN)	// входной. Панель перегона.
		{


		s=s+"<br>";
	 	string s2="";


		if(span_soup and span_soup.GetNamedTagAsBool("Inited",false))
			{

			string[] bb_s = new string[4];



			if(!wrong_dir)
				{
				bb_s[0]="";
		        	bb_s[1]="";
			        bb_s[2]="<b>";
			        bb_s[3]="</b>";
			        }
			else
				{
				bb_s[0]="<b>";
				bb_s[1]="</b>";
				bb_s[2]="";
				bb_s[3]="";
				}


			s2 = hw.MakeRow(
        		        		hw.MakeCell(STT.GetString("dir_track_to")
        		        		,"bgcolor='#555555'")+
	                			hw.MakeCell(hw.MakeLink("live://property/spanTrackFromOther",bb_s[0]+privateName+"@"+stationName+"  &gt;&gt;&gt; "+bb_s[1])
	                			,"bgcolor='#555555'")+
	                			hw.MakeCell(hw.MakeLink("live://property/spanTrackFromMe",bb_s[2]+"&lt;&lt;&lt; "+span_soup.GetNamedTag("end_sign_n")+"@"+span_soup.GetNamedTag("end_sign_s")+bb_s[3])

		                		,"bgcolor='#555555'")

			                );


			}


		s2=hw.MakeTable(hw.MakeRow(
			hw.MakeCell(
				hw.MakeTable(
					hw.MakeRow(
						hw.MakeCell(hw.MakeLink("live://property/make_span", STT.GetString("make_span"))
						,"bgcolor=#888888 colspan='3'")
					)+


					s2

				,"bgcolor=#5555FF width=100%")
			)));




		s=s+hw.MakeTable(
			hw.MakeRow(
				hw.MakeCell(s2,
				"bgcolor=#FF0000")
			)
		,"width=90%");



                s=s+hw.EndTable();
		}

	if(Type & ST_PROTECT)
		s=s+"<br>"+GetProtectTable();		

	if (Type & (ST_IN | ST_OUT | ST_ROUTER | ST_PERMOPENED | ST_FLOAT_BLOCK)) {
		s = s + "<br>" + GetCntFloatBlockTable();
	}

	if(!( Type &  ST_UNLINKED) or (Type & ST_FLOAT_BLOCK))
		s=s+"<br>"+GetCntSpeedTable();

	s=s+"<br>"+GetExtraSetTable();


        s=s+"<br></body></html>";
 	return s;
 }




public string GetPropertyType(string id)
{

	string s="link";

	if(id=="private-name")
		{
 		s="string,0,50";
 		}
	else if(id=="station_create" or id =="protect_create")
		{
		s="string,0,100";
		}
	else if(id=="station_name" or id == "protect_name")
		{
		s="list,1";
		}
	else if(id=="lens_kit_ex")
		{
		s="string,10,10";
		}
	else if(id=="displace" or id=="vert_displ")
		{
		s="float,-10,10,0.05";
		}
	else if(id=="along_displ")
		{
		s="float,-100,100,0.1";
		}
	else if(id=="head_rot" or id=="head_krepl_rot")
		{
		s="int,-180,180,1";
		}
	else if(id=="priority")
		{
		s="int,-1,1000";
		}
	else if (id=="twait")
		{
		s="int,0,500,1";
		}
	else if(id=="pause_bef_red")
		{
		s="float,0,10,0.1";
		}
	else if (id == "distanceRY") {
		s = "int,0," + distanceY + ",1";
	}
	else if (id[,10] == "distanceRY") {
		s = "link";
	}
	else if (id == "distanceY") {
		s = "int," + distanceRY + "," + distanceG + ",1";
	}
	else if (id[,9] == "distanceY") {
		s = "link";
	}
	else if (id == "distanceG") {
		s = "int," + distanceY + ",50,1";
	}
	else if (id[,9] == "distanceG") {
		s = "link";
	}
	else
		{
		string[] str_a = Str.Tokens(id+"","/");
		if(str_a[0]=="speed")
			s="int,-1,500";
		}

	return s;
}


public void SetPropertyValue(string id, float val)
{
	bool position_change = false;

	if(id == "displace")
		{
		displacement=val;
		position_change = true;
		}
	else if(id == "vert_displ")
		{
		vert_displ=val;
		position_change = true;
		}
	else if(id == "along_displ")
		{
		along_displ=val;
		position_change = true;
		}
	else if(id == "pause_bef_red")
		{
		pause_bef_red = val;
		}

	if(position_change)
		{
		SetMeshTranslation("default", displacement-def_displ, along_displ, vert_displ);


		if(MU)
			{
			string mu_head_displ = ST.GetString("mu_head_displ");
			if(mu_head_displ != "")
				{
				float dz = Str.ToFloat(TrainUtil.GetUpTo(mu_head_displ,","));

				MU.MainMesh.SetMeshTranslation("default", 0, 0, dz );
				MU.Table.SetMeshTranslation("default", 0, 0, dz );
				}
			else
				{
				MU.MainMesh.SetMeshTranslation("default", 0, 0, MU.BasicMeshOffset);
				MU.Table.SetMeshTranslation("default", 0, 0, MU.BasicMeshOffset);
				}
			}
		}
}



void SetHeadRotation(bool start)
{

	int h_n = head_conf.size();
	int i;

	Asset provod_as;

	if( (head_rot-head_krepl_rot) <= 0)
		provod_as = GetAsset().FindAsset("provod_l");
	else
		provod_as = GetAsset().FindAsset("provod_r");

	if(start and head_rot==0 and head_krepl_rot==0)
		{
		for(i=0;i<h_n;i++)
			SetFXAttachment("provod"+i, provod_as);
		}
	else
		{
		for(i=0;i<h_n;i++)
			{
			SetMeshOrientation("kreplenie"+i, 0, 0, head_krepl_rot);
			SetMeshOrientation("golovka"+i, 0, 0, head_rot-head_krepl_rot);
			SetFXAttachment("provod"+i, provod_as);
			}

		if(MU)
			{
			MU.MainMesh.SetMeshOrientation("default",0, 0, head_rot );
			MU.Table.SetMeshOrientation("default", 0, 0, head_rot );
			}

		if(kor_BU)
			kor_BU[0].SetMeshOrientation("default", 0, 0, head_rot );

		}

}



void SetNewGolPosition(bool enable)
{
	int i;

	if(enable)
		{
		string mu_head_displ = ST.GetString("mu_head_displ");
		if(mu_head_displ != "")
			{
			string[] temp = Str.Tokens(mu_head_displ,",");
			int mu_h_n = temp.size();

			float dz = Str.ToFloat(temp[0]);

			MU.MainMesh.SetMeshTranslation("default", 0, 0, dz );
			MU.Table.SetMeshTranslation("default", 0, 0, dz );

			for(i=1;i<mu_h_n;i++)
				{
				int i2 = i-1;
				SetMeshTranslation("kreplenie"+i2, 0, 0, Str.ToFloat(temp[i]) );
				}
			}
		else
			{
			MU.MainMesh.SetMeshTranslation("default", 0, 0, MU.BasicMeshOffset);
			MU.Table.SetMeshTranslation("default", 0, 0, MU.BasicMeshOffset);
			}

		}
	else
		{
		int h_n = head_conf.size();


		for(i=0;i<h_n;i++)
			{
			SetMeshTranslation("kreplenie"+i, 0, 0, 0);
			}
		}
}



public void SetPropertyValue(string id, int val)
{

	if(id=="priority")
		def_path_priority=val;
	else if(id=="head_rot")
		{
		head_rot = DegToRad*val;
		SetHeadRotation(false);
		}
	else if(id=="head_krepl_rot")
		{
		head_krepl_rot = DegToRad*val;
		SetHeadRotation(false);
		}
	else if(id=="twait")
		MU.timeToWait=val;
	else if (id == "distanceRY") {
		distanceRY = val;
		if (distanceRY > distanceY) {
			distanceRY = distanceY;
		}
	}
	else if (id == "distanceY") {
		distanceY = val;
		if (distanceY > distanceG) {
			distanceY = distanceG;
		}
		if (distanceY < distanceRY) {
			distanceY = distanceRY;
		}
	}
	else if (id == "distanceG") {
		distanceG = val;
		if (distanceG < distanceY) {
			distanceG = distanceY;
		}
	}
	else
		{
		string[] str_a = Str.Tokens(id+"","/");
		if(str_a[0]=="speed")
			{
			if(speed_soup.IsLocked())
				{
				Soup sp3 = Constructors.NewSoup();
				sp3.Copy(speed_soup);

				speed_soup=sp3;
				}

			speed_soup.SetNamedTag(str_a[1]+str_a[2],val);
			}
		}


}



void SetNewGolTex(bool[] ex_lins, int[] pos_lins, bool reset)
{
	int num = head_conf.size();



	koz_mesh = new bool[10];

	int[] gol_conf = new int[num];
	int[] koz_conf = new int[num];
	gol_tex_id = new int[num];


	int i;

	for(i=0;i<num;i++)
		{
		gol_conf[i] = head_conf[i]-'0';
		koz_conf[i] = 0;
		gol_tex_id[i] = -1;
		}

	int[] gol_meshes = new int[num];


	for(i=0;i<10;i++)
		{
		koz_mesh[i] = true;

		if(ex_lins[i])
			{
			int pos1 = pos_lins[i];
			int j=0;
			int temp1 = 1;
			int k;

			while( (pos1 - gol_conf[j]) >= 0 )
				{
				pos1 = pos1 - gol_conf[j];
				j++;
				}

			for(k=0;k < pos1;k++)
				temp1 = temp1 * 2;

			koz_conf[j] = koz_conf[j] + temp1;
			}
		}


	int temp_koz_num=0;
	dis_koz = false;


	for(i=0;i< num;i++)
		{

		if( gol_conf[i] == 2  )
			{
			if( koz_conf[i] == 2  )
				{
				gol_tex_id[i] = 0;
				dis_koz = true;
				}

			else if( koz_conf[i] == 1  )
				{
				int j =0;
				while(!ex_lins[j] or (pos_lins[j] !=  temp_koz_num))
					j++;

				koz_mesh[j] = false;


				gol_tex_id[i] = 1;
				dis_koz = true;
				}

			else if( koz_conf[i] == 0  )
				{
				gol_tex_id[i] = 2;
				dis_koz = true;
				}


			}
		else if( gol_conf[i] == 3  )
			{

			if( koz_conf[i] == 2+4  )
				{
				gol_tex_id[i] = 3;
				dis_koz = true;
				}

			else if( koz_conf[i] == 1+4  )
				{
				int j =0;
				while(!ex_lins[j] or (pos_lins[j] !=  temp_koz_num))
					j++;

				koz_mesh[j] = false;
				gol_tex_id[i] = 4;
				dis_koz = true;

				}
			else if( koz_conf[i] == 1+2  )
				{
				int j =0;
				while(!ex_lins[j] or (pos_lins[j] !=  (temp_koz_num+1)) )
					j++;

				koz_mesh[j] = false;
				gol_tex_id[i] = 5;
				dis_koz = true;
				}
			}

		temp_koz_num=temp_koz_num + gol_conf[i];
		}


	if(reset)
		{
		for(i=0;i< num;i++)
			{
			if(gol_tex_id[i] >= 0)
				SetFXTextureReplacement("gol"+i,gol_tex,gol_tex_id[i]);
			else
				SetFXTextureReplacement("gol"+i,null,0);
			}
		}
	else
		{
		for(i=0;i< num;i++)
			{
			if(gol_tex_id[i] >= 0)
				SetFXTextureReplacement("gol"+i,gol_tex,gol_tex_id[i]);
			}
		}

	if(!dis_koz)
		koz_mesh = null;


}




public void SetPropertyValue(string id, string val)
{
        inherited(id,val);
 	if(id == "private-name")
		{
 		privateName = val;
		ShowName(true);
		}

	else if(id=="station_create")
		{
 		stationName = val;

		string[] obj_p=new string[1];
		obj_p[0]=stationName+"";

		if(stationName != " ")
			mainLib.LibraryCall("add_station",obj_p,null);
		obj_p[0]=null;
		}
	else if(id=="protect_create")
		{
 		string[] obj_p=new string[1];
		obj_p[0]=val;

		if(stationName != " ")
			mainLib.LibraryCall("add_protect_signal",obj_p,GSO);
		obj_p[0]=null;
		}

	else if(id=="lens_kit_ex")
		{
		int[] pos_lins = new int[10];
		bool[] ex_lins = new bool[10];


		CreateLinsArr(lens_kit, ex_lins, pos_lins);

		MC.RemoveMeshes(cast<MeshObject>me,  pos_lins);

 		lens_kit = val;
		lens_kit_n = -1;

		CreateLinsArr(lens_kit, ex_lins, pos_lins);


		if( head_conf!="" )
			SetNewGolTex(ex_lins, pos_lins,true);


		MC.MakeMeshes(cast<MeshObject>me, ex_lins, pos_lins, koz_mesh );

		Type = FindTypeByLens(ex_lins);

		kbm_mode = LC.FindPossibleSgn(ex_sgn, ex_lins, prigl_enabled);			//  генерируем розжиг

		if(MainState == zxIndication.STATE_Rx)
			{
			MainState = MainStateALS = zxIndication.STATE_R;
			wrong_dir = false;
			}

		LC.applaySignalState(me, null, 0, false);
 		}
 }



public void LinkPropertyValue(string id)
{
        inherited(id);
	if(id=="station_delete")
		{
		string[] obj_p=new string[1];
		obj_p[0]=stationName+"";

		mainLib.LibraryCall("delete_station",obj_p,null);
		obj_p[0]=null;
		}

	else if(id=="lens_kit")
		{
		lens_kit_n++;

		train_open = false;
		shunt_open = false;

		string[] l_k_arr = GetLensKit();	// если набор линз по-умолчанию

		if(lens_kit_n >= l_k_arr.size())
			lens_kit_n = 0;			// сильно большой



		int[] pos_lins = new int[10];
		bool[] ex_lins = new bool[10];



		CreateLinsArr(lens_kit, ex_lins, pos_lins);
		MC.RemoveMeshes(cast<MeshObject>me,  pos_lins);


		lens_kit = l_k_arr[lens_kit_n];

		CreateLinsArr(lens_kit, ex_lins, pos_lins);


		if( head_conf!="" )
			SetNewGolTex(ex_lins, pos_lins, true);



		MC.MakeMeshes(cast<MeshObject>me, ex_lins, pos_lins , koz_mesh);


		if(ST.GetString("lensT"+lens_kit_n)!="")
			Type = Str.ToInt( ST.GetString("lensT"+lens_kit_n) );
		else
			Type = FindTypeByLens(ex_lins);


		if(ST.GetString("lensab"+lens_kit_n)=="4")
			ab4 = 1;
		else
			ab4 = 0;


		kbm_mode = LC.FindPossibleSgn(ex_sgn, ex_lins, prigl_enabled);			//  генерируем розжиг


		if(MainState == zxIndication.STATE_Rx)
			{
			MainState = MainStateALS = zxIndication.STATE_R;
			wrong_dir = false;
			}

		if(Type & ST_PROTECT)
			{
			if(ex_sgn[zxIndication.STATE_R])
				{
				ex_sgn[zxIndication.STATE_R] = false;
				pre_protected = false;
				}
			else
				{
				pos_lins = new int[10];
				ex_lins = new bool[10];

				CreateLinsArr(lens_kit, ex_lins, pos_lins);
				kbm_mode = LC.FindPossibleSgn(ex_sgn, ex_lins, prigl_enabled);

				if(ex_sgn[zxIndication.STATE_R])
					{
					ex_sgn[zxIndication.STATE_R] = false;
					pre_protected = false;
					}
				else if(ex_sgn[zxIndication.STATE_Y])
					{
					ex_sgn[zxIndication.STATE_Y] = false;
					pre_protected = true;
					}		
				}
			}

		LC.applaySignalState(me, null, 0, false);

		}
	else if(id=="abtype")
		{
		lens_kit_n = -1;

		if(ab4 < 1)
			ab4 = 1;
		else
			ab4 = 0;

		}
	else if(id=="make_span")
		{
		GenerateSpan(true);
		}
	else if(id=="spanTrackFromMe")
		{
		Switch_span(true);
		}
	else if(id=="spanTrackFromOther")
		{
		GameObjectID zxsmId = span_soup.GetNamedTagAsGameObjectID("end_sign");
		zxSignal_main zxsm;
		if (zxsmId) {
			zxsm = cast<zxSignal_main> (Router.GetGameObject(zxsmId));
		}

		if(!zxsm)
			Interface.Exception("Initiate span in signal "+privateName+"@"+stationName);

		zxsm.Switch_span(true);
		}
	else if(id=="speed_init")
		{
		GetDefaultSignalLimits();
		}
	else if(id=="speed_copy")
		{
		mainLib.LibraryCall("speed_copy",null,GSO);
		}
	else if(id=="speed_paste")
		{
		mainLib.LibraryCall("speed_paste",null,GSO);
		}
	else if(id=="kor_BU_1")
		{
		kor_BU_1 = !kor_BU_1;

		if(kor_BU_1)
			kor_BU_2 = false;

		MakeBUArrow();
		}
	else if(id=="kor_BU_2")
		{
		kor_BU_2 = !kor_BU_2;

		if(kor_BU_2)
			kor_BU_1 = false;

		MakeBUArrow();
		}

	else if(id=="prigl_enabled")
		{
		prigl_enabled = !prigl_enabled;

		int[] pos_lins = new int[10];
		bool[] ex_lins = new bool[10];

		CreateLinsArr(lens_kit, ex_lins, pos_lins);
		kbm_mode = LC.FindPossibleSgn(ex_sgn, ex_lins, prigl_enabled);


		if(MainState == zxIndication.STATE_Rx)
			{
			MainState = MainStateALS = zxIndication.STATE_R;
			wrong_dir = false;
			}

		if(Type & ST_PROTECT)
			{
			if(ex_sgn[zxIndication.STATE_R])
				{
				ex_sgn[zxIndication.STATE_R] = false;
				pre_protected = false;
				}
			else
				{
				pos_lins = new int[10];
				ex_lins = new bool[10];

				CreateLinsArr(lens_kit, ex_lins, pos_lins);
				kbm_mode = LC.FindPossibleSgn(ex_sgn, ex_lins, prigl_enabled);

				if(ex_sgn[zxIndication.STATE_R])
					{
					ex_sgn[zxIndication.STATE_R] = false;
					pre_protected = false;
					}
				else if(ex_sgn[zxIndication.STATE_Y])
					{
					ex_sgn[zxIndication.STATE_Y] = false;
					pre_protected = true;
					}		
				}
			}
		}

	else if(id=="yellow_code")
		yellow_code = !yellow_code;

	else if(id=="MU")
		{
		kor_BU_1 = false;
		kor_BU_2 = false;
		MakeBUArrow();

		if(MU)
			{
			MU.Remove();

			MU = null;
			SetNewGolPosition(false);
			}
		else
			{
			MU = new zxRouter();

			MU.Owner = cast<Trackside>me;
			MU.OwnerSignal = cast<zxSignal>me;
			MU.timeToWait = 0;

			MU.Init();
			SetNewGolPosition(true);
			}

		}
	else if(id=="color_rsign")
		{
		if(MU.textureName=="rs_green")
			MU.textureName="rs_white";
		else
			MU.textureName="rs_green";

		MU.UpdateMU();
		}

	if(id=="protect_delete")
		{
		mainLib.LibraryCall("delete_protect",null,GSO);
		}

	else if(id=="type_matrix")
		{
		if(MU.typeMatrix=="9")
			MU.typeMatrix="19";
		else if(MU.typeMatrix=="19")
			MU.typeMatrix="99";
		else if(MU.typeMatrix=="99")
			MU.typeMatrix="x";
		else
			MU.typeMatrix="9";

		MU.SetTypeMatrix();
		}

	else if(id=="protect_influence")
		{
		protect_influence = !protect_influence;
		}

	else if(id=="saut_equipped")
		{
		saut_eq = !saut_eq;
		}

	else if (id == "distanceRY_d") {
		if (distanceRY > 0) {
			--distanceRY;
		}
	}
	else if (id == "distanceRY_u") {
		++distanceRY;
		if (distanceY < distanceRY) {
			distanceY = distanceRY;
		}
		if (distanceG < distanceY) {
			distanceG = distanceY;
		}
	}
	else if (id == "distanceY_d") {
		if (distanceY > 0) {
			--distanceY;
			if (distanceRY > distanceY) {
				distanceRY = distanceY;
			}
		}
	}
	else if (id == "distanceY_u") {
		++distanceY;
		if (distanceG < distanceY) {
			distanceG = distanceY;
		}
	}
	else if (id == "distanceG_d") {
		if (distanceG > 0) {
			--distanceG;
			if (distanceY > distanceG) {
				distanceY = distanceG;
			}
			if (distanceRY > distanceY) {
				distanceRY = distanceY;
			}
		}
	}
	else if (id == "distanceG_u") {
		++distanceG;
	}
	else
		{
		string[] str_a = Str.Tokens(id+"","/");
		if(str_a[0]=="type")
			{

			lens_kit_n = -1;

			if(str_a[1]=="UNTYPED")
				{
				if(Type & ST_UNTYPED)
					Type = Type - ST_UNTYPED;
				else
					Type = Type + ST_UNTYPED;
				}

			if(str_a[1]=="IN")
				{
				if(Type & ST_IN) {
					Type = Type - ST_IN;
					span_soup = null;
					wrong_dir = false;
				}
				else
					Type = Type + ST_IN;
				}

			if(str_a[1]=="OUT")
				{
				if(Type & ST_OUT)
					Type = Type - ST_OUT;
				else
					Type = Type + ST_OUT;
				}

			if(str_a[1]=="ROUTER")
				{
				if(Type & ST_ROUTER)
					Type = Type - ST_ROUTER;
				else
					Type = Type + ST_ROUTER;
				}
			if(str_a[1]=="UNLINKED")
				{
				if(Type & ST_UNLINKED)
					Type = Type - ST_UNLINKED;
				else
					Type = Type + ST_UNLINKED;
				}
			if(str_a[1]=="PERMOPENED")
				{
				if(Type & ST_PERMOPENED)
					{
					Type = Type - ST_PERMOPENED;
					train_open=false;
					}
				else
					{
					train_open = true;

					if(Type & ST_SHUNT)
						Type = Type - ST_SHUNT;
					Type = Type + ST_PERMOPENED;
					}
				}
			if(str_a[1]=="SHUNT")
				{
				if(Type & ST_SHUNT)
					Type = Type - ST_SHUNT;
				else
					{
					train_open = false;

					if(Type & ST_PERMOPENED)
						Type = Type - ST_PERMOPENED;
					Type = Type + ST_SHUNT;
					}
				}

			if(str_a[1]=="ZAGRAD")
				{
				if(Type & ST_PROTECT)
					{
					Type = Type - ST_PROTECT;

					int[] pos_lins = new int[10];
					bool[] ex_lins = new bool[10];

					CreateLinsArr(lens_kit, ex_lins, pos_lins);
					kbm_mode = LC.FindPossibleSgn(ex_sgn, ex_lins, prigl_enabled);


					if(MainState == zxIndication.STATE_Rx)
						{
						MainState = MainStateALS = zxIndication.STATE_R;
						wrong_dir = false;
						}
					}
				else
					{
					Type = Type + ST_PROTECT;

					ProtectGroup = "NewGroup";
					protect_soup = Constructors.NewSoup();

					}
				}

			if(str_a[1]=="FLOAT")
				{
					Type = Type ^ ST_FLOAT_BLOCK;
				}

			x_mode = (Type & ST_PERMOPENED) and (Type & ST_FLOAT_BLOCK) and !(Type & (ST_IN | ST_OUT | ST_ROUTER | ST_UNLINKED));
			}
		else if(str_a[0]=="displace1")
			{
 			displacement=Str.ToFloat(str_a[1]);
			SetMeshTranslation("default", displacement-def_displ, along_displ, vert_displ);

			if(MU)
				{
				string mu_head_displ = ST.GetString("mu_head_displ");
				if(mu_head_displ != "")
					{
					float dz = Str.ToFloat(TrainUtil.GetUpTo(mu_head_displ,","));

					MU.MainMesh.SetMeshTranslation("default", 0, 0, dz );
					MU.Table.SetMeshTranslation("default", 0, 0, dz );
					}
				else
					{
					MU.MainMesh.SetMeshTranslation("default", 0, 0, MU.BasicMeshOffset);
					MU.Table.SetMeshTranslation("default", 0, 0, MU.BasicMeshOffset);
					}
				}
			}
		else if(str_a[0]=="code_freq")
			{
			int tmp_fr = Str.ToInt(str_a[1]);

			if(tmp_fr == 8)
				{
				if(code_freq & 8)
					code_freq = code_freq - 8;
				else
					code_freq = code_freq + 8;
				}
			else
				code_freq = tmp_fr;
			}
		else if(str_a[0]=="code_dev")
			{
			int tmp_fr = Str.ToInt(str_a[1]);
			if(code_dev & tmp_fr)
				code_dev = code_dev - tmp_fr;
			else
				code_dev = code_dev + tmp_fr;
			}
		else if(str_a[0]=="remove_protect_sign")
			{
			zxSignal TMP = cast<zxSignal>(Router.GetGameObject(protect_soup.GetNamedTagAsGameObjectID(str_a[1])));

			if(TMP)
				{
				GSObject[] GSO2=new GSObject[1];
				GSO2[0] = TMP;

				mainLib.LibraryCall("delete_protect_signal",null,GSO2);
				}
			else
				mainLib.LibraryCall("update_protect",null,GSO);				

			}
		}
}





public string[] GetPropertyElementList(string id)
{
	string[] ret;
 	if(id == "station_name")
		{
		int N = Str.ToInt(mainLib.LibraryCall("station_count",null,null));

		string[] obj_p=new string[N];
		mainLib.LibraryCall("station_list",obj_p,null);

		return obj_p;
	 	}

 	else if(id == "protect_name")
		{
		int N = Str.ToInt(mainLib.LibraryCall("protect_count",null,null));

		string[] obj_p=new string[N];
		mainLib.LibraryCall("protect_list",obj_p,null);

		return obj_p;
	 	}
	return ret;
}



public void SetPropertyValue(string id, string val,int idx)
{
	inherited(id,val,idx);

 	if(id=="station_name")
		{
 		stationName=val;


		string[] obj_p=new string[1];
		obj_p[0]=stationName;
		mainLib.LibraryCall("station_edited_set",obj_p,null);
		obj_p[0]=null;

 		}
 	else if(id == "protect_name")
		{
		if(val == "")
			return;

		string[] obj_p=new string[1];
		obj_p[0] = val;

		mainLib.LibraryCall("add_protect_signal",obj_p,GSO);
		obj_p[0]=null;

		}

}


public string GetPropertyValue(string id)
{
	string ret=inherited(id);
	if(id=="private-name")
		{
 		ret=privateName;
 		}

	else if(id=="lens_kit_ex")
		{
 		ret=lens_kit;
 		}
	else if(id=="priority")
		ret=def_path_priority;
	else if (id == "distanceRY") {
		ret = distanceRY;
	}
	else if (id == "distanceY") {
		ret	= distanceY;
	}
	else if (id == "distanceG") {
		ret = distanceG;
	}
	return ret;


}




string GetPropertyName(string id)
{
	string ret=inherited(id);

	if(id=="station_name")
		{
 		ret=STT.GetString("des_stationname");
 		}

	else if(id=="private-name")
		{
 		ret=STT.GetString("des_privatename");
 		}
	else if(id=="station_create")
		{
 		ret=STT.GetString("des_stationcreate");
 		}

	else if(id=="lens_kit_ex")
		{
 		ret=STT.GetString("lens_kit_ex");
 		}


	else if(id=="priority")
		{
 		ret=STT.GetString("priority");
 		}

 	else if(id == "protect_name")
		{
 		ret=STT.GetString("protect_name");
 		}
	else if(id=="protect_create")
		{
 		ret=STT.GetString("des_protectcreate");
 		}

	return ret;

}



public string GetImgMayOpen(bool state)
{
 	HTMLWindow hw=HTMLWindow;
 	string s="";
 	if(state)
	 	s=hw.MakeImage("<kuid2:236443:103204:1>",true,32,32);
	else
		s=hw.MakeImage("<kuid2:236443:103206:1>",true,32,32);

 	return s;
 }



public string GetImgShuntMode(bool state)
{
 	HTMLWindow hw=HTMLWindow;
 	string s="";

	if(state)
	 	s=hw.MakeImage("<kuid2:236443:103210:1>",true,32,32);
	else
		s=hw.MakeImage("<kuid2:236443:103209:1>",true,32,32);

 	return s;
}



public string GetImgPriglMode(bool state)
{
 	HTMLWindow hw=HTMLWindow;
 	string s="";

	if(state)
	 	s=hw.MakeImage("<kuid2:236443:103210:1>",true,32,32);
	else
		s=hw.MakeImage("<kuid2:236443:103206:1>",true,32,32);

 	return s;
}

public string GetImgXMode(bool state) {
 	HTMLWindow hw=HTMLWindow;

	if (state) {
		return hw.MakeImage("<kuid2:236443:103204:1>",true,32,32);
	}
	return hw.MakeImage("<kuid2:236443:103206:1>",true,32,32);
}



public string GetContentViewDetails()
{

 	string s1="",s2="",s3="",s4="";
 	HTMLWindow hw=HTMLWindow;

 	s1=hw.MakeTable(
 		hw.MakeRow(
 			hw.MakeCell("<b>"+ST.GetString("object_desc")+"</b>")
 		)+
 		hw.MakeRow(
 			hw.MakeCell(privateName+" @ "+stationName)
 		)

 	,"width=100% bgcolor=#777777");


	if(MP_NotServer)
		return s1;


	if(Type & ST_PROTECT)
		{
		s2 = 	hw.MakeRow(
 	 			hw.MakeCell(STT.GetString("ability_to_close"),"width=80% bgcolor=#777777")+
 		 		hw.MakeCell(hw.MakeLink("live://"+GetId()+"/MayOpen^"+barrier_closed,GetImgMayOpen(!barrier_closed)),"bgcolor=#777777")
 		 	);
		}
	else
		{

		if( !(Type & ST_SHUNT) )
			s2 = 	hw.MakeRow(
 	 				hw.MakeCell(STT.GetString("ability_to_open"),"width=80% bgcolor=#777777")+
 		 			hw.MakeCell(hw.MakeLink("live://"+GetId()+"/MayOpen^"+!train_open,GetImgMayOpen(train_open)),"bgcolor=#777777")
 		 		);
		}

	if( !(Type & ST_PERMOPENED) )
		{

		if(ex_sgn[zxIndication.STATE_W])	// только если есть маневровый
			s2 = s2+ hw.MakeRow(
 	 				hw.MakeCell(STT.GetString("ability_to_shnt"),"bgcolor=#777777")+
 	 				hw.MakeCell(hw.MakeLink("live://"+GetId()+"/ShuntMode^"+!shunt_open,GetImgShuntMode(shunt_open)),"bgcolor=#777777")
 	 			);


		if(ex_sgn[zxIndication.STATE_RWb] )	// только если есть пригласительный
			s2 = s2+ hw.MakeRow(
 	 				hw.MakeCell(STT.GetString("ability_to_prigl"),"bgcolor=#777777")+
 	 				hw.MakeCell(hw.MakeLink("live://"+GetId()+"/PriglMode^"+!prigl_open,GetImgPriglMode(prigl_open)),"bgcolor=#777777")
	 	 		);
		}

	if (Type & ST_FLOAT_BLOCK) {
		s2 = s2+ hw.MakeRow(
			hw.MakeCell(STT.GetString("ability_to_x_mode"),"bgcolor=#777777")+
			hw.MakeCell(hw.MakeLink("live://"+GetId()+"/XMode^" + !x_mode, GetImgXMode(x_mode)), "bgcolor=#777777")
		);
	}


/*	s2 = s2 + hw.MakeRow(

 	 				hw.MakeCell(STT.GetString("mainstate_rc_count"),"bgcolor=#777777")+

 	 				hw.MakeCell(MainState + " / " + RCCount,"bgcolor=#777777")

	 	 		);
*/

	if((Type & ST_IN) and span_soup and span_soup.GetNamedTagAsBool("Inited",false) )	// входной. Панель перегона.
		{

		string[] bb_s = new string[4];


		if(!wrong_dir)
			{
			bb_s[0]="";
	        	bb_s[1]="";
		        bb_s[2]="<b>";
		        bb_s[3]="</b>";
		        }
		else
			{
			bb_s[0]="<b>";
			bb_s[1]="</b>";
			bb_s[2]="";
			bb_s[3]="";
			}

		s2 = s2 + hw.MakeRow(
        		  		hw.MakeCell(STT.GetString("dir_track_to")+"<br>"+

	                		hw.MakeLink("live://"+GetId()+"/spanTrackFromOther",bb_s[0]+privateName+"@"+stationName+"  &gt;&gt;&gt; "+bb_s[1])+" . "+
	                		hw.MakeLink("live://"+GetId()+"/spanTrackFromMe",bb_s[2]+"&lt;&lt;&lt; "+span_soup.GetNamedTag("end_sign_n")+"@"+span_soup.GetNamedTag("end_sign_s")+bb_s[3]) ,"bgcolor='#555555' align='center'")+

					hw.MakeCell("","bgcolor='#555555'")

			                );
		}

	s1=s1+hw.MakeTable( s2, "width=100% border=1");


 	s1=hw.MakeTable(
 		hw.MakeRow(
 			hw.MakeCell(s1
 			,"bgcolor='#AAAAAA' border=1")
 		)
 	,"width=100%");

//	s1=s1+"<br>"+hw.MakeLink("live://log_databases","Log debug");


 	return s1;
}

public void ChangeText(Message msg)
{
	string[] tok=Str.Tokens(msg.minor,"/");
	if(Str.ToInt(tok[1]) != GetId())
		return;

 	string[] tok2=Str.Tokens(tok[2],"^");
 	if(tok2.size()==1)
		{
		if(tok2[0]=="spanTrackFromMe")
			Switch_span(false);

		if(tok2[0]=="spanTrackFromOther")
			{
			zxSignal zxs2 = cast<zxSignal> (Router.GetGameObject(span_soup.GetNamedTagAsGameObjectID("end_sign")));
			zxs2.Switch_span(false);
			}
		if(tok2[0]=="log_databases")
			{
			mainLib.LibraryCall("log_databases",null,null);
			}

		PostMessage(me,"RefreshBrowser","",0.5);
		}


 	if(tok2.size()>1)
		{
 		if(tok2[0]=="MayOpen")
			{
 			if(tok2[1]=="true")
 				PostMessage(me,"CTRL","MayOpen^true",0);
 			else if(tok2[1]=="false")
 				PostMessage(me,"CTRL","MayOpen^false",0);

 			}
 		else if(tok2[0]=="ShuntMode")
			{
 			if(tok2[1]=="true")
 				PostMessage(me,"CTRL","ShuntMode.true",0);
 			else if(tok2[1]=="false")
 				PostMessage(me,"CTRL","ShuntMode.false",0);

 			}
 		else if(tok2[0]=="PriglMode")
			{
 			if(tok2[1]=="true")
 				PostMessage(me,"CTRL","PriglMode.true",0);
 			else if(tok2[1]=="false")
 				PostMessage(me,"CTRL","PriglMode.false",0);

 			}
 		else if (tok2[0] == "XMode") {
			if (tok2[1] == "true") {
 				PostMessage(me, "CTRL", "XMode^true", 0);
			}
 			else if (tok2[1] == "false") {
 				PostMessage(me, "CTRL", "XMode^false", 0);
			}
		}


 		PostMessage(me,"RefreshBrowser","",0.5);
 		}
}



thread void ShowBrowser(void)
{
	Message msg;
 	while (mn)
        	{
        	wait()
			{
                	on "Browser-Closed","",msg:
				if(msg.src==mn)
					mn=null;
                	}
        	}
        mn=null;

}


public void ViewDetails(Message msg)
{
	if(!mn)
		mn=Constructors.NewBrowser();

        mn.LoadHTMLString(GetAsset(),GetContentViewDetails());
        int x=Math.Rand(0,20);
        int y=Math.Rand(0,20);
        mn.SetWindowRect(100+x,100+y,400+x,450+y);
        ShowBrowser();
}

public void RefreshBrowser(Message msg)
{
 	if(mn)
		mn.LoadHTMLString(me.GetAsset(),GetContentViewDetails());
}


string[] GetLensKit()
{
	int i;
	int n= Str.ToInt(ST.GetString("lensn"));

	string[] temp = new string[n];

	for(i=0;i<n;i++)
		{
		temp[i] = ST.GetString("lens"+i);
		}
	return temp;
}


string ConvLensKit(string s)
{
	string res = "";
	string lens_str1= STT.GetString("lens_str1");

	int i;

	for(i=0;i<s.size();i++)
		{
		if(s[i] != '-' and s[i] != 'n')
			{
			int n1 = Str.ToInt(s[i,i+1]);

			if(2*n1+2 > res.size() )
				{
				int j;
				for(j=res.size();j<2*n1+2;j++)
					res = res + " ";
				}

			res[2*n1,2*n1+2]=lens_str1[2*i,2*i+2];
			}

		}

	return res;
}


void CreateLinsArr(string s, bool[] ex_lins, int[] pos_lins)
	{
	int i;

	for(i=0;i<10;i++)
		{
		if(s[i]=='-' or s[i]=='n')
			ex_lins[i]=false;
		else
			{
			ex_lins[i]=true;
			pos_lins[i]=Str.ToInt(s[i,i+1]);
			}
		}
	}


string ExSignalsToStr(bool[] ex_sgn)
	{
	string ret="";
	if(!ex_sgn or ex_sgn.size()<26)
		return ret;

	int i;
	for(i=0;i<26;i++)
		{
		if(ex_sgn[i])
			ret=ret+"+";
		else
			ret=ret+"-";
		}
	return ret;
	}


bool[] StrToExSignals(string str)
	{
	bool[] ret = new bool[26];
	int i;
	for(i=0;i<26;i++)
		{
		if(str.size() > i)
			ret[i] = (str[i]=='+');
		else
			ret[i] = false;
		}
	return ret;
	}


int FindTypeByLens(bool[] ex_lins)
	{
	int type1 = ST_UNTYPED;


	if(ex_lins[0] and ex_lins[8] and (ex_lins[1] or ex_lins[3]))	// маршрутный обладает и синим, и зелёным(жёлтым)
		type1 = type1 + ST_ROUTER;
	else
		{
		if(!(ex_lins[0] and ex_lins[8]) and  !ex_lins[1] and !ex_lins[3] and !ex_lins[4]) // синекрасные - не маневровые и основных линз нет
			type1 = type1 + ST_SHUNT;
		}


	return type1;
	}





void OldSpanHandler(Message msg)
	{
	if(!(Type & ST_IN))
		return;


	string[] str_a = Str.Tokens(msg.minor, "@");
	if(str_a.size()<2)
		return;

	if((privateName == str_a[0]) and (stationName == str_a[1]))
		{
		zxSignal_main zxsm = cast<zxSignal_main> (Router.GetGameObject(span_soup.GetNamedTagAsGameObjectID("end_sign")));

		if(!zxsm)
			Interface.Exception("Initiate span in signal "+privateName+"@"+stationName);


		if(zxsm.Switch_span(false))
			{
			PostMessage(null,"CTRL3", "SpanDirectionChanged^any^"+msg.minor,0);
			}
		}
	}



void GetDefaultSignalLimits()
{
	speed_soup = Constructors.NewSoup();


	speed_soup.SetNamedTag("p0",60);
	speed_soup.SetNamedTag("c0",50);

	speed_soup.SetNamedTag("p1",0);
	speed_soup.SetNamedTag("c1",0);

	speed_soup.SetNamedTag("p2",0);
	speed_soup.SetNamedTag("c2",0);

	speed_soup.SetNamedTag("p3",25);
	speed_soup.SetNamedTag("c3",25);

	speed_soup.SetNamedTag("p4",40);
	speed_soup.SetNamedTag("c4",40);

	speed_soup.SetNamedTag("p5",60);
	speed_soup.SetNamedTag("c5",50);

	speed_soup.SetNamedTag("p6",60);
	speed_soup.SetNamedTag("c6",50);

	speed_soup.SetNamedTag("p7",40);
	speed_soup.SetNamedTag("c7",40);

	speed_soup.SetNamedTag("p8",80);
	speed_soup.SetNamedTag("c8",80);

	speed_soup.SetNamedTag("p9",120);
	speed_soup.SetNamedTag("c9",80);

	speed_soup.SetNamedTag("p10",120);
	speed_soup.SetNamedTag("c10",80);

	speed_soup.SetNamedTag("p11",120);
	speed_soup.SetNamedTag("c11",80);

	speed_soup.SetNamedTag("p12",80);
	speed_soup.SetNamedTag("c12",80);

	speed_soup.SetNamedTag("p13",25);
	speed_soup.SetNamedTag("c13",25);

	speed_soup.SetNamedTag("p14",120);
	speed_soup.SetNamedTag("c14",80);

	speed_soup.SetNamedTag("p15",40);
	speed_soup.SetNamedTag("c15",40);

	speed_soup.SetNamedTag("p16",60);
	speed_soup.SetNamedTag("c16",50);

	speed_soup.SetNamedTag("p17",120);
	speed_soup.SetNamedTag("c17",80);

	speed_soup.SetNamedTag("p18",40);
	speed_soup.SetNamedTag("c18",40);

	speed_soup.SetNamedTag("p19",0);
	speed_soup.SetNamedTag("c19",0);

	speed_soup.SetNamedTag("p20",25);
	speed_soup.SetNamedTag("c20",25);

	speed_soup.SetNamedTag("p21",40);
	speed_soup.SetNamedTag("c21",40);

	speed_soup.SetNamedTag("p22",40);
	speed_soup.SetNamedTag("c22",40);

	speed_soup.SetNamedTag("p23",40);
	speed_soup.SetNamedTag("c23",40);

	speed_soup.SetNamedTag("p24",80);
	speed_soup.SetNamedTag("c24",80);

	speed_soup.SetNamedTag("p25",80);
	speed_soup.SetNamedTag("c25",80);

	speed_soup.SetNamedTag("Inited",true);

}



public void SetProperties(Soup soup)
	{
	inherited(soup);
	if(!ever_inited)
		{
		default_init = false;
		Init(GetAsset());
		default_init = true;
		}

	stationName = soup.GetNamedTag("stationName");

// добавляем станцию светофора


	if(stationName != "")
		{
		string[] obj_p=new string[1];
		obj_p[0]=stationName;

		mainLib.LibraryCall("add_station",obj_p,null);
		obj_p[0]=null;
		}
	else
		{
		string default1 = mainLib.LibraryCall("station_edited_find",null,null);
		if(default1 != "")
			stationName=default1;
		}


	privateName = soup.GetNamedTag("privateName");

	ShowName(false);
	MainState = soup.GetNamedTagAsInt("MainState",0);
	MainStateALS = soup.GetNamedTagAsInt("MainStateALS", MainState);
	RCCount = soup.GetNamedTagAsInt("RCCount", 0);
	Type = soup.GetNamedTagAsInt("GetSignalType()",-1);

	ab4 = soup.GetNamedTagAsInt("ab4",-1);
	distanceRY = soup.GetNamedTagAsInt("distanceRY", 2);
	distanceY = soup.GetNamedTagAsInt("distanceY", 5);
	distanceG = soup.GetNamedTagAsInt("distanceG", 8);


	lens_kit_n = soup.GetNamedTagAsInt("lens_kit_n",0);
	if(lens_kit_n < 0)						// собственный набор линз
		lens_kit = soup.GetNamedTag("lens_kit");
	else
		{
		string[] l_k_arr=	GetLensKit();				// если набор линз по-умолчанию берём его
		if(lens_kit_n < l_k_arr.size())
			lens_kit = l_k_arr[lens_kit_n];			// если он вообще есть?

		if(ST.GetString("lensT"+lens_kit_n)!="")
			Type = Str.ToInt( ST.GetString("lensT"+lens_kit_n) );

		if(ab4<0)
			{
			if(ST.GetString("lensab"+lens_kit_n)=="4")
				ab4 = 1;
			else
				ab4 = 0;
			}
		}


	int[] pos_lins = new int[10];
	bool[] ex_lins = new bool[10];

	CreateLinsArr(lens_kit, ex_lins, pos_lins);

	dis_koz = soup.GetNamedTagAsBool("dis_koz",false);


	if( head_conf!="" and dis_koz)
		SetNewGolTex(ex_lins, pos_lins,false);



	MC.MakeMeshes(cast<MeshObject>me, ex_lins, pos_lins, koz_mesh );

	OldMainState = -1;

	prigl_enabled = soup.GetNamedTagAsBool("prigl_enabled",false);


	string ex_sign_1 = soup.GetNamedTag("ExSignals_str");
	if(ex_sign_1=="")
		kbm_mode = LC.FindPossibleSgn(ex_sgn, ex_lins, prigl_enabled);			// если розжиг не сгенерирован, генерируем
	else
		{
		ex_sgn=StrToExSignals(ex_sign_1);
		kbm_mode = soup.GetNamedTagAsInt("ExSignals_kbm_mode", 0);
		}


	if(Type < 0)
		Type = FindTypeByLens(ex_lins);

	if(ab4 < 0)
		ab4 = 0;

	//Interface.Print("name "+privateName+" Type = "+Type);


	if(Type & ST_PERMOPENED)
		train_open = true;
	else if(Type & ST_SHUNT)
		train_open = false;
	else
		train_open = soup.GetNamedTagAsBool("train_open",false);

	shunt_open = soup.GetNamedTagAsBool("shunt_open",false);

	prigl_open = soup.GetNamedTagAsBool("prigl_open",false);

	x_mode = soup.GetNamedTagAsBool("x_mode", Type & ST_FLOAT_BLOCK);

	if(Type & ST_PROTECT)
		{
		protect_influence = soup.GetNamedTagAsBool("protect_influence",true);

		if(ex_sgn[zxIndication.STATE_R])
			{
			ex_sgn[zxIndication.STATE_R] = false;
			pre_protected = false;
			}
		else
			{

			int[] pos_lins = new int[10];
			bool[] ex_lins = new bool[10];

			CreateLinsArr(lens_kit, ex_lins, pos_lins);
			kbm_mode = LC.FindPossibleSgn(ex_sgn, ex_lins, prigl_enabled);

			if(ex_sgn[zxIndication.STATE_R])
				{
				ex_sgn[zxIndication.STATE_R] = false;
				pre_protected = false;
				}
			else if(ex_sgn[zxIndication.STATE_Y])
				{
				ex_sgn[zxIndication.STATE_Y] = false;
				pre_protected = true;
				}
			}

		barrier_closed = soup.GetNamedTagAsBool("barrier_closed",false);

		ProtectGroup = soup.GetNamedTag("ProtectGroup");

		if(ProtectGroup != "")
			{
			protect_soup = soup.GetNamedSoup("protect_soup");

			if(protect_soup.IsLocked())
				{
				Soup sp1 = Constructors.NewSoup();
				sp1.Copy(protect_soup);
				protect_soup = sp1;
				}


			string[] return_str= new string[1];
			return_str[0] = ProtectGroup;

			mainLib.LibraryCall("add_protect",return_str,GSO);
			}
		else
			protect_soup = Constructors.NewSoup();

		}
	else
		{
		barrier_closed = false;
		pre_protected = false;
		}

	span_soup = soup.GetNamedSoup("span_soup");
	wrong_dir = soup.GetNamedTagAsBool("wrong_dir",false);


	train_is_l = soup.GetNamedTagAsBool("train_is_l",false);

	speed_soup = soup.GetNamedSoup("speed_soup");
	if( !speed_soup or !speed_soup.GetNamedTagAsBool("Inited",false))
		GetDefaultSignalLimits();



	displacement = soup.GetNamedTagAsFloat("displacement",0);

	def_displ = soup.GetNamedTagAsFloat("def_displ",0);
	if(def_displ == 0)
		{
		def_displ = GetAsset().GetConfigSoup().GetNamedTagAsFloat("trackside",0);
		displacement = def_displ;
		}


	vert_displ = soup.GetNamedTagAsFloat("vert_displ",0);
	along_displ = soup.GetNamedTagAsFloat("along_displ",0);

	pause_bef_red = soup.GetNamedTagAsFloat("pause_bef_red",1.5);

	SetMeshTranslation("default", displacement-def_displ, along_displ, vert_displ);

	if(isMacht)
		{
		if( soup.GetNamedTagAsBool("MU_set",false) )
			{
			if(!MU)
				{
				MU = new zxRouter();
				MU.Owner = cast<Trackside>me;
				MU.OwnerSignal = cast<zxSignal>me;
				}

			MU.SetProperties(soup);
			MU.Init();
			SetNewGolPosition(true);
			}


		kor_BU_1 = soup.GetNamedTagAsBool("kor_BU_1",false);
		kor_BU_2 = soup.GetNamedTagAsBool("kor_BU_2",false);

		MakeBUArrow();

		head_rot = soup.GetNamedTagAsFloat("head_rot",0);
		head_krepl_rot = soup.GetNamedTagAsFloat("head_krepl_rot",0);
		SetHeadRotation(true);
		}

	yellow_code = soup.GetNamedTagAsBool("yellow_code",false);


	if(Type & ST_IN)
		AddHandler(me,"SetSpanDirection","","OldSpanHandler");



	zxSP_id = soup.GetNamedTagAsGameObjectID("zxSPName");
	if(zxSP_id and (zxSP = cast<zxSpeedBoard>Router.GetGameObject(zxSP_id)))
		{
		zxSP_name = zxSP.GetLocalisedName();
		}
	else
		{
		zxSP_name = "";
		}


	MU_id = soup.GetNamedTagAsGameObjectID("MU_name");
	if(MU_id and (linkedMU = cast<Trackside>Router.GetGameObject(MU_id)))
		{
		MU_name = linkedMU.GetLocalisedName();
		}
	else
		{
		MU_name = "";
		}


	predvhod = soup.GetNamedTagAsBool("predvhod",false);
	if(predvhod)
		SetPredvhod();

	if (((Type & ST_SHUNT) or (Type & ST_UNLINKED)) and !x_mode)
		code_freq = soup.GetNamedTagAsInt("code_freq",0);
	else
		code_freq = soup.GetNamedTagAsInt("code_freq",2);


	code_dev = soup.GetNamedTagAsInt("code_dev");
	def_path_priority = soup.GetNamedTagAsInt("def_path_priority",0);

	saut_eq = soup.GetNamedTagAsBool("saut_equipped",false);


	if(station_edited and stationName!="")
		{
		station_edited = false;

		string[] obj_p=new string[1];
		obj_p[0]=stationName;
		mainLib.LibraryCall("station_edited_set",obj_p,null);
		obj_p[0]=null;

		}

	Inited=true;


	if ((Type &  ST_UNLINKED) and !x_mode)
		{
		if((Type &  (ST_IN | ST_OUT)) and !train_open)
			{
			MainState = MainStateALS = zxIndication.STATE_R;
			SetSignalState(null, RED, "");
			}
		else
			SetSignalState(null, GREEN, "");

		if(MainState == zxIndication.STATE_RWb)
			(cast<bb_RWb>LC.sgn_st[zxIndication.STATE_RWb].l).white_lens = kbm_mode;

		LC.sgn_st[MainState].l.InitIndif(set_lens, set_blink);
		NewSignal(set_lens,0,0.7);

		if(IsServer)
			mainLib.LibraryCall("mult_settings",null,GSO);
		}
	else
		UpdateState(0,-1);

		
	SetMainStateSpeedLim();		// задание номинальных скоростей светофора
	}


public Soup GetProperties(void)
	{
	if(!ever_inited)
		{
		default_init = false;
		Init(GetAsset());
		default_init = true;
		}


	Soup retSoup = inherited();
	retSoup.SetNamedTag("train_open",train_open);
	retSoup.SetNamedTag("shunt_open",shunt_open);
	retSoup.SetNamedTag("barrier_closed",barrier_closed);
	retSoup.SetNamedTag("prigl_open",prigl_open);
	retSoup.SetNamedTag("x_mode", x_mode);


	retSoup.SetNamedTag("stationName",stationName);
	retSoup.SetNamedTag("privateName",privateName);
	retSoup.SetNamedTag("MainState",MainState);
	retSoup.SetNamedTag("MainStateALS", MainStateALS);
	retSoup.SetNamedTag("RCCount", RCCount);

	if(!wrong_dir)
		{
		if ((Type & (ST_UNLINKED|ST_PROTECT)) and !x_mode)
			retSoup.SetNamedTag("privateStateEx", LC.sgn_st[zxIndication.STATE_B].l.MainState   );	// для совместимости с z7
		else
			retSoup.SetNamedTag("privateStateEx", LC.sgn_st[MainState].l.MainState   );	// для совместимости с z7
		}
	else
		retSoup.SetNamedTag("privateStateEx", 1000   );

	retSoup.SetNamedTag("GetSignalType()",Type);

	retSoup.SetNamedTag("ExSignals_str",ExSignalsToStr(ex_sgn));
	retSoup.SetNamedTag("ExSignals_kbm_mode",kbm_mode);


	retSoup.SetNamedTag("lens_kit_n",lens_kit_n);
	retSoup.SetNamedTag("lens_kit",lens_kit);
	retSoup.SetNamedTag("dis_koz",dis_koz);

	retSoup.SetNamedTag("displacement",displacement);
	retSoup.SetNamedTag("def_displ",def_displ);
	retSoup.SetNamedTag("vert_displ",vert_displ);
	retSoup.SetNamedTag("along_displ",along_displ);

	retSoup.SetNamedTag("wrong_dir",wrong_dir);
	retSoup.SetNamedTag("train_is_l",train_is_l);
	retSoup.SetNamedTag("ab4",ab4);
	retSoup.SetNamedTag("distanceRY", distanceRY);
	retSoup.SetNamedTag("distanceY", distanceY);
	retSoup.SetNamedTag("distanceG", distanceG);

	retSoup.SetNamedTag("code_freq",code_freq);
	retSoup.SetNamedTag("code_dev",code_dev);
	retSoup.SetNamedTag("saut_equipped",saut_eq);

	retSoup.SetNamedTag("def_path_priority",def_path_priority);
	retSoup.SetNamedTag("predvhod",predvhod);
	retSoup.SetNamedTag("kor_BU_1",kor_BU_1);
	retSoup.SetNamedTag("kor_BU_2",kor_BU_2);
	retSoup.SetNamedTag("yellow_code",yellow_code);
	retSoup.SetNamedTag("prigl_enabled", prigl_enabled);

	retSoup.SetNamedTag("pause_bef_red",pause_bef_red);

	if(isMacht)
		{
		retSoup.SetNamedTag("head_rot",head_rot);
		retSoup.SetNamedTag("head_krepl_rot",head_krepl_rot);


		if(MU)
			{
			retSoup.SetNamedTag("MU_set",true);
			MU.GetProperties(retSoup);

			}
		else
			retSoup.SetNamedTag("MU_set",false);

		}

	if(span_soup and span_soup.GetNamedTagAsBool("Inited",false))
		{
		if(span_soup.IsLocked())
			{
			Soup sp1 = Constructors.NewSoup();
			sp1.Copy(span_soup);
			retSoup.SetNamedSoup("span_soup",sp1);
			}
		else
			retSoup.SetNamedSoup("span_soup",span_soup);
		}

	if(speed_soup and speed_soup.GetNamedTagAsBool("Inited",false))
		{
		if(speed_soup.IsLocked())
			{
			Soup sp1 = Constructors.NewSoup();
			sp1.Copy(speed_soup);
			retSoup.SetNamedSoup("speed_soup",sp1);
			}
		else
			retSoup.SetNamedSoup("speed_soup",speed_soup);

		}

	if(Type & ST_PROTECT)
		{
		retSoup.SetNamedTag("ProtectGroup",ProtectGroup);
		retSoup.SetNamedTag("protect_influence",protect_influence);
		
		if(protect_soup)
			{
			if(protect_soup.IsLocked())
				{
				Soup sp1 = Constructors.NewSoup();
				sp1.Copy(protect_soup);
				retSoup.SetNamedSoup("protect_soup",sp1);
				}
			else
				retSoup.SetNamedSoup("protect_soup",protect_soup);

			}
		}



	if(zxSP_id)
		{
		zxSP= cast<zxSpeedBoard>Router.GetGameObject(zxSP_id);
		if(zxSP)
			retSoup.SetNamedTag("zxSPName", zxSP_id);
		}


	if(MU_id)
		{
		linkedMU= cast<Trackside>Router.GetGameObject(MU_id);
		if(linkedMU)
			retSoup.SetNamedTag("MU_name", MU_id);
		}

	return retSoup;
	}


void OffMU(Message msg)
	{
	if(MU!=null)
		{
		MU.OffMU();
		}
	}

public void Init(Asset asset)
	{
	if(default_init)
		inherited(asset);

	if(ever_inited)
		return;

	ever_inited = true;

	GSO=new GSObject[1];
	GSO[0] = cast<GSObject>me;
	string[] return_str = new string[1];
	return_str[0] = GetName();
	KUID utilLibKUID = asset.LookupKUIDTable("main_lib");
        mainLib = World.GetLibrary(utilLibKUID);
	mainLib.LibraryCall("add_signal",return_str,GSO);


	tex=asset.FindAsset("tex_tabl");
	tabl_m=asset.FindAsset("tabl");


	ST = asset.GetStringTable();
  	STT = asset.FindAsset("main_lib").GetStringTable();

	MC = new zxMeshController();

	if(ST.GetString("is_led") == "1")
		{
		MC.dt_on = 0;
		MC.dt_off = 0;
		}

	LC = zxLightContainer;
	if(!LC.sgn_st)
		LC.Init();


	set_lens = new bool[10];
	set_blink = new bool[10];
	ex_sgn = new bool[26];

	blink_lens = new int[0];

	code_freq=2;

	if(ST.GetString("is_macht") == "1")
		{
		isMacht = true;
		head_conf = ST.GetString("head_konf");
		if(head_conf!="")
			gol_tex =GetAsset().FindAsset("gol_tex");
		}

	AddHandler(me,"MapObject","View-Details","ViewDetails");
  	AddHandler(me,"RefreshBrowser","","RefreshBrowser");
	AddHandler(me,"Browser-URL","","ChangeText");


	AddHandler(me,"UpdateMU","Off","OffMU");

	NullSoup = Constructors.NewSoup();

	}


public void Init()
	{
	//Asset asset = GetAsset();
	}

public Soup DetermineUpdatedState()
	{
	return NullSoup;
	}

public void ApplySpeedLimitForStateEx(int state)
	{
	}

void ApplyUpdatedState(Soup signalStateSoup)
	{
	}

};
