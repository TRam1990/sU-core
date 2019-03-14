include "zx_specs.gs"



class zxSpeedLimit_main isclass zxSpeedLimit
{
StringTable ST;

int signal_number = 0;
Soup signal_soup;



public string GetPropertyType(string id)
{
	if(id=="max_speed_pass" or id=="max_speed_cargo")
		return "int,-1,500";

	return "link";
}

public void SetPropertyValue(string id, int val)
{

	if(id=="max_speed_pass")
		max_speed_pass = val/3.6;
	else if(id=="max_speed_cargo")
		max_speed_cargo = val/3.6;
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
		str=str+MakeLinkRow("live://property/max_speed_pass",ST.GetString("max_speed_pass"), max_speed_pass*3.6);//HTMLWindow.MakeLink("live://property/max_speed_pass",ST.GetString("max_speed_pass")+(int)(max_speed_pass*3.6))+"<br>";
		str=str+MakeLinkRow("live://property/max_speed_cargo",ST.GetString("max_speed_cargo"), max_speed_cargo*3.6);//HTMLWindow.MakeLink("live://property/max_speed_cargo",ST.GetString("max_speed_cargo")+(int)(max_speed_cargo*3.6))+"<br><br>";
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
		}
	else if(id=="limit_end")
		{
		is_limit_start = false;
		signal_number = 0;
		SetMeshVisible("begin",false,0.0);
		SetMeshVisible("end",true,0.0);		
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
				temp.max_speed_pass = max_speed_pass;
				temp.max_speed_cargo = max_speed_cargo;

				priority = temp.FindTrainPrior(false);

				temp.SetSpeedLim( temp.GetCurrSpeedLim( temp.GetSpeedLim(priority), priority ) );
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
	max_speed_pass=soup.GetNamedTagAsFloat("max_speed_pass",22.22);
	max_speed_cargo=soup.GetNamedTagAsFloat("max_speed_cargo",22.22);


	is_limit_start=soup.GetNamedTagAsBool("is_limit_start",false);

	if(is_limit_start)
	{
		SetMeshVisible("begin",true,0.0);
		SetMeshVisible("end",false,0.0);
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

	float old_lim = soup.GetNamedTagAsFloat("old_vel",22.22);

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

}


};
