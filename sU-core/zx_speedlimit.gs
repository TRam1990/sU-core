include "zx_specs.gs"



class zxSpeedLimit_main isclass zxSpeedLimit
{
StringTable ST;

int signal_number = 0;
Soup signal_soup;


Library  mainLib;
GSObject[] GSO;



public string GetPropertyType(string id)
{
	if(id=="max_speed_pass" or id=="max_speed_cargo")
		return "int,-1,500";

	return "link";
}

void SetLimitCaption()
{
	if(!is_limit_start)
		return;

	string s="/";
	s = (int)(max_speed_pass*3.6)+s+(int)(max_speed_cargo*3.6);
	SetFXNameText("limit_caption",s);
}


public void SetPropertyValue(string id, int val)
{

	if(id=="max_speed_pass")
		max_speed_pass = val/3.6;
	else if(id=="max_speed_cargo")
		max_speed_cargo = val/3.6;

	SetLimitCaption();
}




string MakeRadioButtonCell(string link1,string deskr, bool value)
{

 	string s=HTMLWindow.StartCell("bgcolor='#888888'");
 	s=s+HTMLWindow.RadioButton(link1,value);
 	s=s+" "+HTMLWindow.MakeLink(link1, deskr);
 	s=s+HTMLWindow.EndCell();

	return s;
}

string MakeLinkRow(string link1,string deskr, int value)
{
	string s=HTMLWindow.StartRow();
 	s=s+HTMLWindow.StartCell("bgcolor='#888888'");
 	s=s+" "+HTMLWindow.MakeLink(link1, deskr);
 	s=s+HTMLWindow.EndCell();
 	s=s+HTMLWindow.StartCell("bgcolor='#888888'");
 	s=s+HTMLWindow.MakeLink(link1,value);
 	s=s+HTMLWindow.EndCell();
	s=s+HTMLWindow.EndRow();

	return s;
}


public string GetDescriptionHTML(void)
{
        string str="<html><body><br>";


	str=str+HTMLWindow.StartTable("border='1'");

	str=str+HTMLWindow.StartRow();
	str=str+MakeRadioButtonCell("live://property/limit_start", ST.GetString("limit_start"), is_limit_start);
	str=str+MakeRadioButtonCell("live://property/limit_end", ST.GetString("limit_end"), !is_limit_start);
	str=str+HTMLWindow.EndRow();

	str=str+HTMLWindow.EndTable()+"<br>";

	if(is_limit_start)
		{
		str=str+HTMLWindow.StartTable("border='1'");
		str=str+MakeLinkRow("live://property/max_speed_pass",ST.GetString("max_speed_pass"), max_speed_pass*3.6);
		str=str+MakeLinkRow("live://property/max_speed_cargo",ST.GetString("max_speed_cargo"), max_speed_cargo*3.6);
		str=str+HTMLWindow.EndTable();

		str=str+HTMLWindow.StartTable("border='1'");
		str=str+HTMLWindow.StartRow();
		str=str+HTMLWindow.MakeCell(HTMLWindow.MakeLink("live://property/speed_copy",ST.GetString("str_speed_copy")), "bgcolor='#888888'");
		str=str+HTMLWindow.MakeCell(HTMLWindow.MakeLink("live://property/speed_paste",ST.GetString("str_speed_paste")), "bgcolor='#888888'");
		str=str+HTMLWindow.EndRow();
		str=str+HTMLWindow.EndTable()+"<br>";

		str=str+HTMLWindow.MakeLink("live://property/init_limit",ST.GetString("init_limit"))+"<br><br>";

		if(signal_number > 0)
			{
			str=str+ ST.GetString("linked_sing")+"<br><br>";
			int i;

			for(i = 0; i < signal_number; i++)
				str=str + signal_soup.GetNamedTag(i+"")+"<br>";
			}

		}

	str=str+"<br></body></html>";
        return str;
}





void  LinkPropertyValue (string id)
{
	if(id=="init_limit")
		{
		signal_soup.Clear();
		signal_number = 0;

		GSTrackSearch GSTS = BeginTrackSearch(true);
		MapObject MO = GSTS.SearchNext();

		while(MO and !(MO.isclass(zxSpeedLimit) and GSTS.GetFacingRelativeToSearchDirection() == true))
			{
			if( MO.isclass(zxSignal) and GSTS.GetFacingRelativeToSearchDirection() == true and  (!((cast<zxSignal>MO).Type & zxSignal.ST_UNLINKED)) and (!((cast<zxSignal>MO).MainState == 19)) )
				{
				signal_soup.SetNamedTag(""+signal_number, MO.GetName());
				signal_number++;
				}

			if(MO.isclass(Trackside) and !MO.isclass(Junction) and GSTS.GetDistance()>3000 )
				{
				bool temp_dir=GSTS.GetFacingRelativeToSearchDirection();
				GSTS = (cast<Trackside>MO).BeginTrackSearch(temp_dir);
				}			

			MO = GSTS.SearchNext();
			}




		}
	else if(id=="limit_start")
		{
		is_limit_start = true;
		SetMeshVisible("begin",true,0.0);
		SetMeshVisible("end",false,0.0);

		SetLimitCaption();
		}
	else if(id=="limit_end")
		{
		is_limit_start = false;
		signal_number = 0;
		SetMeshVisible("begin",false,0.0);
		SetMeshVisible("end",true,0.0);		
		}
	else if(id=="speed_copy")
		{
		mainLib.LibraryCall("limit_speed_copy",null,GSO);
		}
	else if(id=="speed_paste")
		{
		mainLib.LibraryCall("limit_speed_paste",null,GSO);
		SetLimitCaption();
		}
		
}

thread void InitSignals()
{
	Sleep(0.1);

	bool inited = false;
	int i;
	int priority;

	while(!inited)
		{
		inited = true;

		for(i = 0; i < signal_number; i++)
			{
			zxSignal temp = cast<zxSignal>(Router.GetGameObject( signal_soup.GetNamedTag(i+"") ));
			
			if(temp)
				{
				temp.out_speed_pass = max_speed_pass;
				temp.out_speed_cargo = max_speed_cargo;
				temp.out_speed_set = true;

				priority = temp.FindTrainPrior(false);

				temp.ApplyNewSpeedLimit(-1);

				//temp.SetSpeedLim( temp.GetCurrSpeedLim( temp.GetSpeedLim(priority), priority ) );
				}
			else	
				inited = false;
			}
	
		Sleep(1.0);
		}
}

public void  SetProperties (Soup soup)
{
	inherited(soup);
	max_speed_pass=soup.GetNamedTagAsFloat("max_speed_pass",22.23);
	max_speed_cargo=soup.GetNamedTagAsFloat("max_speed_cargo",22.23);


	is_limit_start=soup.GetNamedTagAsBool("is_limit_start",false);

	if(is_limit_start)
	{
		SetMeshVisible("begin",true,0.0);
		SetMeshVisible("end",false,0.0);
		SetLimitCaption();
	}
	else
	{
		SetMeshVisible("begin",false,0.0);
		SetMeshVisible("end",true,0.0);
	}

	signal_number=soup.GetNamedTagAsInt("signal_number",0);

	if(signal_number > 0)
		{
		signal_soup.Copy( soup.GetNamedSoup("signal_soup"));

		InitSignals();
		}

	float old_lim = soup.GetNamedTagAsFloat("old_vel",22.23);

	if(old_lim > 0)
		SetSpeedLimit(old_lim);


}

public Soup  GetProperties (void)
{
	Soup ret=inherited();
	ret.SetNamedTag("max_speed_pass",max_speed_pass);
	ret.SetNamedTag("max_speed_cargo",max_speed_cargo);

	ret.SetNamedTag("is_limit_start",is_limit_start);

	if(signal_number > 0)
		{
		ret.SetNamedTag("signal_number",signal_number);
		ret.SetNamedSoup("signal_soup",signal_soup);
		}

	ret.SetNamedTag("old_vel",GetSpeedLimit());


	return ret;	
}



public void Init(Asset asset)
{
	inherited(asset);
	ST=asset.GetStringTable();
	
	signal_soup = Constructors.NewSoup();

	GSO=new GSObject[1];
	GSO[0] = cast<GSObject>me;
	string[] return_str = new string[1];
	return_str[0] = GetName();
	KUID utilLibKUID = asset.LookupKUIDTable("main_lib");
        mainLib = World.GetLibrary(utilLibKUID);
	mainLib.LibraryCall("add_speed_object",return_str,GSO);

}


};
