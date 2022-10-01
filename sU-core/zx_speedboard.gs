include "zx_specs.gs"



class zxSpeedBoard_main isclass zxSpeedBoard
{
StringTable ST;

GameObjectID Sig_id;

Library  mainLib;
GSObject[] GSO;


public void UpdateSpeedboard(bool set_limit)
{
	max_speed_pass = prev_speed_pass;
	max_speed_cargo = prev_speed_cargo;

	if(max_speed_pass < next_speed_pass)		// ���������� �� �����������
		max_speed_pass = next_speed_pass;

	if(max_speed_cargo < next_speed_cargo)
		max_speed_cargo = next_speed_cargo;

	if(set_limit)
		mainLib.LibraryCall("new_speedboard_speed",null,GSO);
}






public string GetPropertyType(string id)
{
	return "link";
}



public string GetDescriptionHTML(void)
{
        string str="<html><body><br>";
        
	str=str+HTMLWindow.MakeLink("live://property/reset",ST.GetString("reset"))+"<br><br>";

	str=str+ ST.GetString("linked_sing");
	zxSignal sign = cast<zxSignal>Router.GetGameObject(Sig_id);
	if (sign) {
		str=str+sign.GetLocalisedName();
	}
	else {
		str=str+"<i>none</i>";
	}

	str=str+"<br></body></html>";
        return str;
}






void  LinkPropertyValue (string id)
{
	if(id=="reset")
		{
		if(Sig_id)
			{
			zxSignal zxS = cast<zxSignal>Router.GetGameObject(Sig_id);
			if(zxS)
				zxS.SetzxSpeedBoard(null);
			}


		GSTrackSearch GSTS = BeginTrackSearch(true);
		MapObject MO = GSTS.SearchNext();

		while((MO and !(MO.isclass(zxSignal) and GSTS.GetFacingRelativeToSearchDirection() == true and  !( ! ((cast<zxSignal>MO).Type & zxSignal.ST_UNTYPED) or (cast<zxSignal>MO).Type & zxSignal.ST_UNLINKED) )   ) )
			MO = GSTS.SearchNext();


		if(MO)
			{
			(cast<zxSignal>MO).SetzxSpeedBoard(me);
			Sig_id = MO.GetGameObjectID();
			}

		}
		
}



public void  SetProperties (Soup soup)
{
	inherited(soup);

	prev_speed_pass=soup.GetNamedTagAsFloat("prev_speed_pass",22.22);
	prev_speed_cargo=soup.GetNamedTagAsFloat("prev_speed_cargo",22.22);


	next_speed_pass=soup.GetNamedTagAsFloat("next_speed_pass",22.22);
	next_speed_cargo=soup.GetNamedTagAsFloat("next_speed_cargo",22.22);


	Sig_id=soup.GetNamedTagAsGameObjectID("Sig_name");


	SetSpeedLimit( next_speed_cargo );

	//SetNewSpeed(ExtraSpeed, true);

}

public Soup  GetProperties (void)
{
	Soup ret=inherited();

	ret.SetNamedTag("prev_speed_pass",prev_speed_pass);
	ret.SetNamedTag("prev_speed_cargo",prev_speed_cargo);
	ret.SetNamedTag("next_speed_pass",next_speed_pass);
	ret.SetNamedTag("next_speed_cargo",next_speed_cargo);

	ret.SetNamedTag("Sig_name",Sig_id);
	return ret;	
}



public void Init(Asset asset)
{
	inherited(asset);
	ST=asset.GetStringTable();

	GSO=new GSObject[1];
	GSO[0] = cast<GSObject>me;
	string[] return_str = new string[1];
	return_str[0] = GetName();
	KUID utilLibKUID = asset.LookupKUIDTable("main_lib");
        mainLib = World.GetLibrary(utilLibKUID);
	mainLib.LibraryCall("add_speed_object",return_str,GSO);
}


};
