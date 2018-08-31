include "zx_specs.gs"
include "zx_indication.gs"
include "zx_meshcontrol.gs"
include "zx_router.gs"




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


StringTable ST, STT;
Asset tabl_m,tex,gol_tex;

MeshObject[] lens;

float displacement;

float def_displ;

float vert_displ;
float along_displ;

string zxSP_name;
string MU_name;


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

public bool yellow_code;

public zxRouter MU;


string name_decoded;
Soup NullSoup;


string[] GetLensKit();
void CreateLinsArr(string s, bool[] ex_lins, int[] pos_lins);
int FindTypeByLens(bool[] ex_lins);
void GetDefaultSignalLimits();
void SetBUArrow(bool state);


define float DegToRad = 0.01745;



public thread void Blinker()
	{

	int[] arr=new int[0];
	int i,j=0;
	for(i=0;i<10;i++)
		{
		if(set_blink[i])
			{
			arr[j,j+1]=new int[1];
			arr[j]=i;
			j++;
			}
		}
	if(arr.size()==0)
		return;
	while(set_blink[arr[0]])
		{
		for(i=0;i<arr.size();i++)
			MC.SetMesh(arr[i],true);
		Sleep(0.7);
		if(set_blink[arr[0]])
			{
			for(i=0;i<arr.size();i++)
				MC.SetMesh(arr[i],false);
			Sleep(0.7);
			}
		}

	}


public thread void NewSignal(bool[] set_lens, float dt1, float dt2)
	{
	if(dt1 != 0)
		Sleep(dt1);
	MC.OffMeshes(set_lens);
	Sleep(dt2);
	MC.SetMeshes(set_lens);
	Blinker();
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
			SetBUArrow( !(MainState == 0 or MainState == 1 or MainState == 2 or MainState == 19) );


		if(MU_name != "")
			{
			if(!linkedMU)
				linkedMU= cast<Trackside>Router.GetGameObject(MU_name);

			if(linkedMU)
				{
				if(MainState == 1)
					PostMessage(linkedMU,"UpdateMU","Update",0);
				else
					PostMessage(linkedMU,"UpdateMU","Update",0.7);
				}
			}

		if(MU)
			{
			if(MainState == 1)
				MU.UpdateMU();
			else
				MUChecker();
			}


		LC.sgn_st[MainState].l.InitIndif(set_lens, set_blink);

		if(set_auto_state)
			{
			if(MainState == 1)
				SetSignalState(0, "");
			else if((MainState > 1 and MainState < 9) or MainState == 13 or MainState == 16 or MainState == 18 or MainState == 22 or MainState == 23)
				SetSignalState(1, "");
			else
				SetSignalState(2, "");
			}

		OldMainState = MainState;
		return true;
		}

	return false;
	}


public void SetSignal(bool set_auto_state)
	{
	if(SetOwnSignalState(set_auto_state))
		{
		if(MainState == 1)
			NewSignal(set_lens,0,pause_bef_red);
		else
			NewSignal(set_lens,0,0.7);

		if(IsServer)
			mainLib.LibraryCall("mult_settings",null,GSO);
		}
	}



public void CheckPrevSignals(bool no_train)
	{

	string[] track_params = new string[2];

	if(!Inited or !IsObligatory() )
		{
		return;
		}


	mainLib.LibraryCall("find_prev_signal",track_params,GSO);


	if(!Cur_prev or !Cur_prev.Inited)
		return;

	int Other_OldState =  Cur_prev.MainState;
	int Other_MainState = LC.FindSignalState((track_params[0])[0]=='+', Other_OldState, Cur_prev.ex_sgn, Cur_prev.ab4, Str.ToInt(track_params[1]), Cur_prev.train_open, Cur_prev.shunt_open, (track_params[0])[1]=='+', MainState);


	if( ((track_params[0])[0]!='+' or no_train) and Other_OldState != Other_MainState)
		{
		Cur_prev.MainState = Other_MainState;
		Cur_prev.CheckPrevSignals(false);
		int prior1 = Cur_prev.FindTrainPrior(false);
		Cur_prev.SetSpeedLim( Cur_prev.GetCurrSpeedLim(  Cur_prev.GetSpeedLim( prior1 ), prior1 ) );
		Cur_prev.SetSignal(true);
		}

	}

void CheckMySignal(bool train_entered)
	{

	string[] track_params = new string[2];


	mainLib.LibraryCall("find_next_signal",track_params,GSO);
	int next_state = 0;

	if(Cur_next)
		next_state = Cur_next.MainState;
	else
		{
		next_state = 1;
		(track_params[0])[0]='+';
		}

	MainState = LC.FindSignalState(((track_params[0])[0]=='+') or train_entered, MainState, ex_sgn, ab4, Str.ToInt(track_params[1]), train_open, shunt_open, (track_params[0])[1]=='+', next_state);

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

	if(Type & ST_PROTECT and reason==0)
		{
		if(barrier_closed)
			{
			if(!pre_protected)
				{
				MainState=1;
				SetSignalState(0, "");
				}
			else
				{
				MainState=6;
				SetSignalState(2, "");
				}


			SetSignal(false);

			if(!protect_influence)
				return;

			CheckPrevSignals(true);

			return;
			}
		else
			{
			SetSignalState(2, "");

			if(!(Type & ST_UNLINKED))
				MainState = LC.FindSignalState(false, 0, ex_sgn, ab4, 0, train_open, shunt_open, false, 0);
			else
				MainState = 0;

			string[] track_params = new string[2];
				
			mainLib.LibraryCall("find_next_signal",track_params,GSO);

			if(Cur_next)
				Cur_next.CheckPrevSignals(false);

			
			SetSignal(false);
			}
		}



	if(Type & ST_UNLINKED)
		{
		if(Type & (ST_IN+ST_OUT) )
			{
			if(reason==1 and (train_open or shunt_open))
				{
				train_open = false;
				shunt_open = false;
				MainState=1;
				SetSignalState(0, "");
				SetSignal(false);
				CheckPrevSignals(false);
				}
			if(reason==0)
				{
				if(!train_open and !shunt_open)
					{
					MainState=1;
					SetSignalState(0, "");
					CheckPrevSignals(false);
					SetSignal(false);
					}
				else
					{
					SetSignalState(2, "");

					if(shunt_open)
						MainState=20;
					else
						{						

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
		if(shunt_open)
			{
			shunt_open=false;
			MainState = LC.FindSignalState(false, 0, ex_sgn, ab4, 0, train_open, shunt_open, false, 0);


			float new_speed_limit = 0;

			if(MainState != 19)
				{
				if(priority < 0)
					priority = FindTrainPrior(false);

				new_speed_limit = GetCurrSpeedLim( GetSpeedLim(priority), priority );
				}

			SetSpeedLim(new_speed_limit);
			SetSignal(true);
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

			if((track_params[0])[0]=='+')
				{					// если перед светофором есть поезд, открываем в обычном порядке
				CheckMySignal(false);
				CheckPrevSignals(false);
				}
			else
				{
				MainState = 19;

				mainLib.LibraryCall("find_next_signal",track_params,GSO);

				if(Cur_next)
					Cur_next.CheckPrevSignals(false);
				}

			}
		else
			{
			CheckMySignal(false);

			if(MainState == 19)
				{
				string[] track_params = new string[2];
				
				mainLib.LibraryCall("find_next_signal",track_params,GSO);

				if(Cur_next and Cur_next.Inited)
					Cur_next.CheckPrevSignals(false);

				}
			else
				CheckPrevSignals(false);		// поиск следующего светофора
			}

		float new_limit = 0;

		if(MainState != 19)
			{
			if(priority < 0)
				priority = FindTrainPrior(false);

			new_limit = GetCurrSpeedLim( GetSpeedLim( priority ), priority );
			}

		SetSpeedLim( new_limit );


		SetSignal(true);	
		}

	else if(reason==1 and train_open)
		{
		string[] type_ToFind = new string[2];


		if(priority < 0)
			priority = FindTrainPrior(false);

		type_ToFind[0]=priority;
		type_ToFind[1]="-";
		mainLib.LibraryCall("new_speed",type_ToFind,GSO);

		if(!(Type & ST_PERMOPENED))
			train_open = false;

		CheckMySignal(true);

		SetSignal(true);

		mainLib.LibraryCall("find_prev_signal",type_ToFind,GSO);
		}

	else if(reason==2)
		{
		if( IsObligatory() )
			{
			CheckPrevSignals(false);
			}
		}



	if(Type & (ST_PERMOPENED+ST_IN) and !(Type & ST_UNLINKED) and MainState != 2)
		{
		if(reason==3)
			CheckPrevSignals(true);
		else if(reason==4)
			{
			CheckMySignal(false);

			SetSignal(true);	
			}
		}



	if( (reason==2 or reason==4) and (Type & (ST_IN+ST_OUT+ST_ROUTER)) )
		{
		GSTrackSearch GSTS1;

		if( AttachedJunction != "")
			{
			Junction jun1 = cast<Junction>( Router.GetGameObject(AttachedJunction) );
			AttachedJunction = "";

			if(jun1)
				{
				PostMessage(jun1,"Object", "InnerLeave",0);
				}
			}
		}

	}



public void UnlinkedUpdate(int mainstate)
	{

	if(MP_NotServer)
		return;

	if(Type & ST_PERMOPENED)
		{
		if(mainstate == 0)
			mainstate = 1;


		if(ex_sgn[1] or ex_sgn[6])
			MainState = LC.FindSignalState(false, 0, ex_sgn, ab4, 0, train_open, false, false, mainstate);
		else if(ex_sgn[14])
			{		// является повторительным, т.к. имеет только зелёную линзу
			if(mainstate == 0 or mainstate == 1  or mainstate == 2  or mainstate == 3 or mainstate == 20  or mainstate == 21)
				MainState = 0;
			else
				MainState = 14;

			}
		else
			MainState = 0;

		SetSignal(false);
		}
	else if(Type & (ST_IN+ST_OUT))
		{
		if(train_open)
			{
			MainState = mainstate;
			SetSignalState(2, "");
			SetSignal(false);
			}
		}
	else
		{
		MainState = mainstate;
		SetSignal(false);
		}

	}




public void SetzxSpeedBoard(MapObject newSP)
	{
	if(!newSP)
		{
		zxSP=null;
		zxSP_name="";
		return;
		}

	zxSP=cast<zxSpeedBoard>newSP;
	zxSP_name=zxSP.GetName();
	}


public void SetLinkedMU(Trackside MU2)
	{
	if(!MU2)
		{
		linkedMU=null;
		MU_name="";
		return;
		}

	linkedMU=MU2;
	MU_name=linkedMU.GetName();
	}



/*

	22 47 48 50

CP1251	A  Щ  Э  Я

UTF-8	Рђ Р© Р­ РЇ

	Р° С‰ СЌ СЏ

*/



int GetCirillic(string s)
	{
	if(s>="Рђ" and s<="Р©")
		{
		return (22 + s[1] - 'ђ');
		}

	if(s>="Р­" and s<="РЇ")
		{
		return (48 + s[1] - '­');
		}

	if(s>="Р°" and s<="С‰")
		{
		if(s[0]=='Р')
			return (22 + s[1] - '°');
		else
			{
			return (86 + s[1] - '°');
			}
		}

	if(s>="СЌ" and s<="СЏ")
		{
		return (48 + s[1] - 'Ќ');
		}


	return -1;

	}

int GetArabic(int i, string s)
	{
	if(s[i]>='0' and s[i]<='9')
		return (s[i] - '0');
	return -1;
	}

void GetRome(int i, string s, int[] result)
	{
	int s_size = s.size();


	if(s[i]=='I')
		{
		if( (i+1) < s_size )
			{
			if(s[i+1]=='I')
				{
				if((i+2) < s_size and s[i+2]=='I')
					{
					result[0] = 12;
					result[1] = 2;
					}
				else
					{
					result[0] = 11;
					result[1] = 1;
					}
				}
			else if(s[i+1]=='V')
				{
				result[0] = 13;
				result[1] = 1;
				}
			else if(s[i+1]=='X')
				{
				result[0] = 18;
				result[1] = 1;
				}
			else
				{
				result[0] = 10;
				result[1] = 0;
				}
			}
		else
			{
			result[0] = 10;
			result[1] = 0;
			}
		}
	else if(s[i]=='V')
		{
		if( (i+1) < s_size and s[i+1]=='I')
			{

			if((i+2) < s_size and s[i+2]=='I')
				{
				if((i+3) < s_size and s[i+3]=='I')
					{
					result[0] = 17;
					result[1] = 3;
					}
				else
					{
					result[0] = 16;
					result[1] = 2;
					}
				}
			else
				{
				result[0] = 15;
				result[1] = 1;
				}
			}
		else
			{
			result[0] = 14;
			result[1] = 0;
			}

		}
	else if(s[i]=='X')
		{
		result[0] = 19;
		result[1] = 0;
		}
	else
		result[0] = -1;
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

		tabl[j]=GetArabic(i, sv_name);

		if(tabl[j]<0)
			{
			if(i<sv_name.size()-1)
				{
				string part=sv_name[i,i+2];
				tabl[j]=GetCirillic(part);
				}

			if(tabl[j] < 0)
				{
				GetRome(i, sv_name, temp);

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
			while(tabl[q]>=22 and q<n_tabl )
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
	else
		{


/*
ряды табичек


01234
56789
*/


		if(q == 1)
			{
			MeshObject MO = SetFXAttachment(name_str[2], tabl_m);
			MO.SetFXTextureReplacement("texture",tex,tabl[0]);
			}
		else if(q == 2)
			{
			MeshObject MO = SetFXAttachment(name_str[1], tabl_m);
			MO.SetFXTextureReplacement("texture",tex,tabl[0]);
			MO = SetFXAttachment(name_str[3], tabl_m);
			MO.SetFXTextureReplacement("texture",tex,tabl[1]);
			}
		else if(q == 3)
			{
			MeshObject MO = SetFXAttachment(name_str[0], tabl_m);
			MO.SetFXTextureReplacement("texture",tex,tabl[0]);
			MO = SetFXAttachment(name_str[2], tabl_m);
			MO.SetFXTextureReplacement("texture",tex,tabl[1]);
			MO = SetFXAttachment(name_str[4], tabl_m);
			MO.SetFXTextureReplacement("texture",tex,tabl[2]);
			}

		int q1 = n_tabl - q;


		if(q1 > 0)
			{

			if(q1 == 1)
				{
				MeshObject MO = SetFXAttachment(name_str[7], tabl_m);
				MO.SetFXTextureReplacement("texture",tex,tabl[q]);
				}
			else if(q1 == 2)
				{
				MeshObject MO = SetFXAttachment(name_str[6], tabl_m);
				MO.SetFXTextureReplacement("texture",tex,tabl[q]);
				MO = SetFXAttachment(name_str[8], tabl_m);
				MO.SetFXTextureReplacement("texture",tex,tabl[(q+1)]);
				}
			else if(q1 == 3)
				{
				MeshObject MO = SetFXAttachment(name_str[5], tabl_m);
				MO.SetFXTextureReplacement("texture",tex,tabl[q]);
				MO = SetFXAttachment(name_str[7], tabl_m);
				MO.SetFXTextureReplacement("texture",tex,tabl[(q+1)]);
				MO = SetFXAttachment(name_str[9], tabl_m);
				MO.SetFXTextureReplacement("texture",tex,tabl[(q+2)]);
				}
			}
		}
}



public void Deswitch_span()
{

	int n = span_soup.GetNamedTagAsInt("Extra_sign",0);
	int i;
	for(i=0;i<n;i++)
		{
		zxSignal zxs = cast<zxSignal> (Router.GetGameObject(span_soup.GetNamedTag("sub_sign_"+i)));
		zxs.MainState = 2;
		zxs.SetSignal(true);
		}

	if(n>0)
		{
		zxSignal zxs = cast<zxSignal> (Router.GetGameObject(span_soup.GetNamedTag("sub_sign_"+(n-1))));
		zxs.CheckPrevSignals(false);
		}


	wrong_dir = true;

	if(SetOwnSignalState(true))
		NewSignal(set_lens,0,0.7);

	
	if(IsServer)
		mainLib.LibraryCall("mult_settings",null,GSO);

}


public bool Switch_span()		// повернуть светофор в сторону этого светофора
{
	if(MP_NotServer)
		return true;

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





	int n = span_soup.GetNamedTagAsInt("Extra_sign",0);
	int i;
	zxSignal zxs;

	for(i=0;i<n;i++)
		{
		zxs = cast<zxSignal> (Router.GetGameObject(span_soup.GetNamedTag("sub_sign_"+i)));
		zxs.MainState = 1;
		}


	zxSignal_main zxsm = cast<zxSignal_main> (Router.GetGameObject(span_soup.GetNamedTag("end_sign")));
	zxsm.Deswitch_span();

	wrong_dir=false;

	UpdateState(0, -1);


	if(IsServer)
		mainLib.LibraryCall("mult_settings",null,GSO);

	return true;
}








public void Switch_span2()		// повернуть светофор в сторону этого светофора
{

	if(MP_NotServer)
		return;

	int n = span_soup.GetNamedTagAsInt("Extra_sign",0);
	int i;

	for(i=0;i<n;i++)
		{
		zxSignal zxs = cast<zxSignal> (Router.GetGameObject(span_soup.GetNamedTag("sub_sign_"+i)));
		zxs.MainState = 1;
		}


	zxSignal_main zxsm = cast<zxSignal_main> (Router.GetGameObject(span_soup.GetNamedTag("end_sign")));
	zxsm.Deswitch_span();

	wrong_dir=false;

	UpdateState(0,-1);

	if(IsServer)
		mainLib.LibraryCall("mult_settings",null,GSO);
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
				span_soup.SetNamedTag("sub_sign_"+Extra_sign,MO.GetName());
				Extra_sign++;
				}
			else
				{
				if((cast<zxSignal_main>MO).predvhod)
					{
					(cast<zxSignal_main>MO).predvhod = false;
					(cast<zxSignal_main>MO).SetPredvhod();
					}
				TempMO = MO;
				}
			}



		if(MO.isclass(Trackside) and !MO.isclass(Junction) and GSTS.GetDistance()>3000 )
			{
			temp_dir=GSTS.GetFacingRelativeToSearchDirection();
			GSTS = (cast<Trackside>MO).BeginTrackSearch(temp_dir);
			}
		MO = GSTS.SearchNext();
		}
	if(!MO)
		return;

	if(TempMO)
		{
		(cast<zxSignal_main>TempMO).predvhod = true;
		(cast<zxSignal_main>TempMO).SetPredvhod();
		}
	zxSignal_main zx_oth = cast<zxSignal_main>MO;

	span_soup.SetNamedTag("Extra_sign",Extra_sign);

	span_soup.SetNamedTag("end_sign",MO.GetName());
	span_soup.SetNamedTag("end_sign_n",zx_oth.privateName);
	span_soup.SetNamedTag("end_sign_s",zx_oth.stationName);

	if(recurs)
		{
		zx_oth.GenerateSpan(false);
		Switch_span2();
		}

	span_soup.SetNamedTag("Inited",true);
}




public int GetALSNCode(void)
	{
	if(barrier_closed and protect_influence)
		return CODE_NONE;

	if( MainState == 1 or MainState == 3 or ( (MainState == 20 or MainState == 21 ) and Type&(ST_IN+ST_OUT+ST_ROUTER) ) )
		return CODE_REDYELLOW;
	else if( (MainState >= 4 and MainState <= 7) or MainState == 13 or MainState == 16 or MainState == 18 or MainState == 22 or MainState == 23)
		return CODE_YELLOW;
	else if(yellow_code and (MainState == 9 or MainState == 11) )
		return CODE_YELLOW;		
	else if(MainState >= 9 and MainState != 19)
		return CODE_GREEN;

	if(MainState == 19)	
		return CODE_YELLOW;

	return CODE_NONE;
	}



public int GetALSNTypeSignal(void)
	{
	if((Type & ST_UNTYPED) == 0 or MainState == 19)
		return TYPE_NONE;
	
	if(barrier_closed and protect_influence)
		return TYPE_CIRCUIT;


	int type1 = TYPE_NONE;

	if(Type & ST_IN)
		type1 = type1 + TYPE_IN;

	if(Type & ST_OUT)
		type1 = type1 + TYPE_OUT;

	if(Type & ST_ROUTER)
		type1 = type1 + TYPE_DIVIDE;

	if(type1 == TYPE_NONE and Type & ST_UNLINKED )
		return TYPE_NONE;

	if(Type & ST_PERMOPENED)
		type1 = type1 + TYPE_PASSING;

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


                        for(i=0;i<26;i++)
				{

                        	if(ex_sgn[i] and (i != 9 or ab4) and i!=19)

					{

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
		zxSignal TMP = cast<zxSignal>(Router.GetGameObject(protect_soup.GetNamedTag(i+"")));

		if(TMP)
	       		s=s+hw.MakeRow(
					hw.MakeCell(TMP.privateName,"colspan=2")+
					hw.MakeCell(hw.MakeLink("live://property/remove_protect_sign/"+protect_soup.GetNamedTag(i+""),"X"),"align='center' width='5%'")       		
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


	if( !(Type & ST_PERMOPENED) )
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

	if( isMacht and !(Type & ST_UNLINKED) )
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




	if( GetALSNTypeSignal() != TYPE_NONE )
		{

		s=s+hw.StartTable("border='1' width=90%");

		s=s+hw.StartRow();
		s=s+hw.MakeCell(STT.GetString("ALS"),"bgcolor='#AAAAAA' colspan='2' ");


	  	if(Type & (ST_OUT | ST_ROUTER) and !(Type & ST_IN))
			{
			s=s+hw.StartCell("bgcolor='#886666' colspan='3' align='center'");
			s=s+hw.CheckBox("live://property/code_dev/1", code_dev & 1);
	 		s=s+" "+hw.MakeLink("live://property/code_dev/1", STT.GetString("code_dev"));
	  		}
		else if(Type & ST_IN) 
			s=s+hw.StartCell("bgcolor='#886666' colspan='4' align='center' ") + "  ";
		else 
			s=s+hw.StartCell("bgcolor='#886666' colspan='3' align='center' ") + "  ";


		s=s+hw.EndCell();
		s=s+hw.EndRow();


		s=s+hw.StartRow();
		s=s+MakeRadioButtonCell("live://property/code_freq/0",STT.GetString("uncoded"), code_freq==0);
		s=s+MakeRadioButtonCell("live://property/code_freq/1",STT.GetString("ALS25"), code_freq & 1);
		s=s+MakeRadioButtonCell("live://property/code_freq/2",STT.GetString("ALS50"), code_freq & 2);

		if(Type & ST_IN)
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


		if(Type & ST_IN)
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
		}

 	s=s+hw.StartTable("border='1' width=90%");

 	s=s+MakeCheckBoxRow("live://property/type/UNTYPED",STT.GetString("UNTYPED_flag"), Type & ST_UNTYPED);
 	s=s+MakeCheckBoxRow("live://property/type/IN",STT.GetString("IN_flag"), Type & ST_IN);
 	s=s+MakeCheckBoxRow("live://property/type/OUT",STT.GetString("OUT_flag"), Type & ST_OUT);
 	s=s+MakeCheckBoxRow("live://property/type/ROUTER",STT.GetString("ROUTER_flag"), Type & ST_ROUTER);
 	s=s+MakeCheckBoxRow("live://property/type/UNLINKED",STT.GetString("UNLINKED_flag"), Type & ST_UNLINKED);
 	s=s+MakeCheckBoxRow("live://property/type/PERMOPENED",STT.GetString("PERMOPENED_flag"), Type & ST_PERMOPENED);
 	s=s+MakeCheckBoxRow("live://property/type/SHUNT",STT.GetString("SHUNT_flag"), Type & ST_SHUNT);
 	s=s+MakeCheckBoxRow("live://property/type/ZAGRAD",STT.GetString("ZAGRAD_flag"), Type & ST_PROTECT);

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


	if(!( Type &  ST_UNLINKED))
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
	if(id == "displace")
		{
		displacement=val;
		SetMeshTranslation("default", displacement-def_displ, along_displ, vert_displ);
		}
	else if(id == "vert_displ")
		{
		vert_displ=val;
		SetMeshTranslation("default", displacement-def_displ, along_displ, vert_displ);
		}
	else if(id == "along_displ")
		{
		along_displ=val;
		SetMeshTranslation("default", displacement-def_displ, along_displ, vert_displ);
		}
	else if(id == "pause_bef_red")
		{
		pause_bef_red = val;
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

		LC.FindPossibleSgn(ex_sgn, ex_lins);			//  генерируем розжиг
		MainState = LC.FindSignalState(false, 0, ex_sgn, ab4, 0, train_open, shunt_open, false, 0);
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


		LC.FindPossibleSgn(ex_sgn, ex_lins);			//  генерируем розжиг

		if(Type & ST_PROTECT)
			{
			if(ex_sgn[1])
				{
				ex_sgn[1] = false;
				pre_protected = false;
				}
			else
				{
				int[] pos_lins = new int[10];
				bool[] ex_lins = new bool[10];

				CreateLinsArr(lens_kit, ex_lins, pos_lins);
				LC.FindPossibleSgn(ex_sgn, ex_lins);

				if(ex_sgn[1])
					{
					ex_sgn[1] = false;
					pre_protected = false;
					}
				else if(ex_sgn[6])
					{
					ex_sgn[6] = false;
					pre_protected = true;
					}		
				}
			}

		MainState = LC.FindSignalState(false, 0, ex_sgn, ab4, 0, train_open, shunt_open, false, 0);

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
		Switch_span2();
		}
	else if(id=="spanTrackFromOther")
		{
		zxSignal_main zxsm = cast<zxSignal_main> (Router.GetGameObject(span_soup.GetNamedTag("end_sign")));
		zxsm.Switch_span2();
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
				if(Type & ST_IN)
					Type = Type - ST_IN;
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
					LC.FindPossibleSgn(ex_sgn, ex_lins);
					}
				else
					{
					Type = Type + ST_PROTECT;

					ProtectGroup = "NewGroup";
					protect_soup = Constructors.NewSoup();

					}
				}

			}
		else if(str_a[0]=="displace1")
			{
 			displacement=Str.ToFloat(str_a[1]);
			SetMeshTranslation("default", displacement-def_displ, along_displ, vert_displ);
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
			zxSignal TMP = cast<zxSignal>(Router.GetGameObject(str_a[1]));

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


public string GetContentViewDetails(void)
{

 	string s1="",s2="",s3="";
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
 		 		hw.MakeCell(hw.MakeLink("live://MayOpen^"+barrier_closed,GetImgMayOpen(!barrier_closed)),"bgcolor=#777777")
 		 	);
		}
	else
		{

		if( !(Type & ST_SHUNT) )
			s2 = 	hw.MakeRow(
 	 				hw.MakeCell(STT.GetString("ability_to_open"),"width=80% bgcolor=#777777")+
 		 			hw.MakeCell(hw.MakeLink("live://MayOpen^"+!train_open,GetImgMayOpen(train_open)),"bgcolor=#777777")
 		 		);
		}

	if( !(Type & ST_PERMOPENED) )
		s3 =	hw.MakeRow(
 	 			hw.MakeCell(STT.GetString("ability_to_shnt"),"bgcolor=#777777")+
 	 			hw.MakeCell(hw.MakeLink("live://ShuntMode^"+!shunt_open,GetImgShuntMode(shunt_open)),"bgcolor=#777777")
 	 		);




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


		s3 = s3 + hw.MakeRow(
        		  		hw.MakeCell(STT.GetString("dir_track_to")+"<br>"+

	                		hw.MakeLink("live://spanTrackFromOther",bb_s[0]+privateName+"@"+stationName+"  &gt;&gt;&gt; "+bb_s[1])+" . "+
	                		hw.MakeLink("live://spanTrackFromMe",bb_s[2]+"&lt;&lt;&lt; "+span_soup.GetNamedTag("end_sign_n")+"@"+span_soup.GetNamedTag("end_sign_s")+bb_s[3]) ,"bgcolor='#555555' align='center'")+

					hw.MakeCell("","bgcolor='#555555'")


			                );


		}

	s1=s1+hw.MakeTable(
			s2 + s3
 	 	,"width=100% border=1");


 	s1=hw.MakeTable(
 		hw.MakeRow(
 			hw.MakeCell(s1
 			,"bgcolor='#AAAAAA' border=1")
 		)
 	,"width=100%");


 	return s1;
}

public void ChangeText(Message msg)
{
 	string s="";
	string[] tok=Str.Tokens(msg.minor,"/");
 	string[] tok2=Str.Tokens(tok[1],"^");

 	if(tok2.size()==1)
		{
		if(tok2[0]=="spanTrackFromMe")
			Switch_span();

		if(tok2[0]=="spanTrackFromOther")
			{
			zxSignal zxs2 = cast<zxSignal> (Router.GetGameObject(span_soup.GetNamedTag("end_sign")));
			zxs2.Switch_span();
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
 		if(tok2[0]=="ShuntMode")
			{
 			if(tok2[1]=="true")
 				PostMessage(me,"CTRL","ShuntMode.true",0);
 			else if(tok2[1]=="false")
 				PostMessage(me,"CTRL","ShuntMode.false",0);

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
			on "Browser-URL","",msg:
				{
			        ChangeText(msg);
                        	continue;
                        	}
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
		zxSignal_main zxsm = cast<zxSignal_main> (Router.GetGameObject(span_soup.GetNamedTag("end_sign")));

		if(zxsm.Switch_span())
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

	speed_soup.SetNamedTag("p18",60);
	speed_soup.SetNamedTag("c18",50);

	speed_soup.SetNamedTag("p19",-1);
	speed_soup.SetNamedTag("c19",-1);

	speed_soup.SetNamedTag("p20",25);
	speed_soup.SetNamedTag("c20",25);

	speed_soup.SetNamedTag("p21",40);
	speed_soup.SetNamedTag("c21",40);

	speed_soup.SetNamedTag("p22",40);
	speed_soup.SetNamedTag("c22",40);

	speed_soup.SetNamedTag("p23",40);
	speed_soup.SetNamedTag("c23",40);

	speed_soup.SetNamedTag("p24",60);
	speed_soup.SetNamedTag("c24",50);

	speed_soup.SetNamedTag("p25",120);
	speed_soup.SetNamedTag("c25",80);

	speed_soup.SetNamedTag("Inited",true);

}



public void SetProperties(Soup soup)
	{
	//inherited(soup);
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
	Type = soup.GetNamedTagAsInt("GetSignalType()",-1);

	ab4 = soup.GetNamedTagAsInt("ab4",-1);


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

	string ex_sign_1 = soup.GetNamedTag("ExSignals_str");
	if(ex_sign_1=="")
		LC.FindPossibleSgn(ex_sgn, ex_lins);			// если розжиг не сгенерирован, генерируем
	else
		ex_sgn=StrToExSignals(ex_sign_1);


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

	if(Type & ST_PROTECT)
		{
		protect_influence = soup.GetNamedTagAsBool("protect_influence",true);

		if(ex_sgn[1])
			{
			ex_sgn[1] = false;
			pre_protected = false;
			}
		else
			{

			int[] pos_lins = new int[10];
			bool[] ex_lins = new bool[10];

			CreateLinsArr(lens_kit, ex_lins, pos_lins);
			LC.FindPossibleSgn(ex_sgn, ex_lins);

			if(ex_sgn[1])
				{
				ex_sgn[1] = false;
				pre_protected = false;
				}
			else if(ex_sgn[6])
				{
				ex_sgn[6] = false;
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



	zxSP_name = soup.GetNamedTag("zxSPName");
	if(zxSP_name != "")
		{
		zxSP= cast<zxSpeedBoard>Router.GetGameObject(zxSP_name);
		}


	MU_name = soup.GetNamedTag("MU_name");
	if(MU_name != "")
		{
		linkedMU= cast<Trackside>Router.GetGameObject(MU_name);
		}


	predvhod = soup.GetNamedTagAsBool("predvhod",false);
	if(predvhod)
		SetPredvhod();

	if((Type & ST_SHUNT) or (Type & ST_UNLINKED))
		code_freq = soup.GetNamedTagAsInt("code_freq",0);
	else
		code_freq = soup.GetNamedTagAsInt("code_freq",2);


	code_dev = soup.GetNamedTagAsInt("code_dev");
	def_path_priority = soup.GetNamedTagAsInt("def_path_priority",0);


	AttachedJunction = soup.GetNamedTag("AttachedJunction");


	if(station_edited and stationName!="")
		{
		station_edited = false;

		string[] obj_p=new string[1];
		obj_p[0]=stationName;
		mainLib.LibraryCall("station_edited_set",obj_p,null);
		obj_p[0]=null;

		}

	Inited=true;


	if( Type &  ST_UNLINKED)
		{
		if((Type &  (ST_IN | ST_OUT)) and !train_open)
			{
			MainState=1;
			SetSignalState(0, "");
			}
		else
			SetSignalState(2, "");

		LC.sgn_st[MainState].l.InitIndif(set_lens, set_blink);
		NewSignal(set_lens,0,0.7);

		if(IsServer)
			mainLib.LibraryCall("mult_settings",null,GSO);
		}
	else
		UpdateState(0,-1);


	}


public Soup GetProperties(void)
	{
	Soup retSoup = Constructors.NewSoup();
	retSoup.SetNamedTag("train_open",train_open);
	retSoup.SetNamedTag("shunt_open",shunt_open);
	retSoup.SetNamedTag("barrier_closed",barrier_closed);

	retSoup.SetNamedTag("stationName",stationName);
	retSoup.SetNamedTag("privateName",privateName);
	retSoup.SetNamedTag("MainState",MainState);

	if(!wrong_dir)
		retSoup.SetNamedTag("privateStateEx", LC.sgn_st[MainState].l.MainState   );	// для совместимости с z7
	else
		retSoup.SetNamedTag("privateStateEx", 1000   );

	retSoup.SetNamedTag("GetSignalType()",Type);

	retSoup.SetNamedTag("ExSignals_str",ExSignalsToStr(ex_sgn));

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

	retSoup.SetNamedTag("code_freq",code_freq);
	retSoup.SetNamedTag("code_dev",code_dev);
	retSoup.SetNamedTag("def_path_priority",def_path_priority);
	retSoup.SetNamedTag("predvhod",predvhod);
	retSoup.SetNamedTag("kor_BU_1",kor_BU_1);
	retSoup.SetNamedTag("kor_BU_2",kor_BU_2);
	retSoup.SetNamedTag("yellow_code",yellow_code);


	retSoup.SetNamedTag("pause_bef_red",pause_bef_red);

	retSoup.SetNamedTag("AttachedJunction",AttachedJunction);

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



	if(zxSP_name != "")
		{
		zxSP= cast<zxSpeedBoard>Router.GetGameObject(zxSP_name);
		if(zxSP)
			retSoup.SetNamedTag("zxSPName", zxSP_name);
		}


	if(MU_name != "")
		{
		linkedMU= cast<Trackside>Router.GetGameObject(MU_name);
		if(linkedMU)
			retSoup.SetNamedTag("MU_name", MU_name);
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
	inherited(asset);
	GSO=new GSObject[1];
	GSO[0] = cast<GSObject>me;
	string[] return_str = new string[1];
	return_str[0] = GetName();
	KUID utilLibKUID = asset.LookupKUIDTable("main_lib");
        mainLib = World.GetLibrary(utilLibKUID);
	mainLib.LibraryCall("add_signal",return_str,GSO);


	tex=asset.FindAsset("tex_tabl");
	tabl_m=asset.FindAsset("tabl");

	AttachedJunction ="";


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

	AddHandler(me,"UpdateMU","Off","OffMU");

	NullSoup = Constructors.NewSoup();

	}


public void Init(void)
	{
	//Asset asset = GetAsset();


	}

public Soup DetermineUpdatedState(void)
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