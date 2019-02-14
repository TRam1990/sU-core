include "zx_specs.gs"



class zxSpeedBoard_main isclass zxSpeedBoard
{
StringTable ST;

string Sig_name;



public string GetPropertyType(string id)
{
	return "link";
}



public string GetDescriptionHTML(void)
{
        string str="<html><body><br>";
        
	str=str+HTMLWindow.MakeLink("live://property/reset",ST.GetString("reset"))+"<br><br>";

	str=str+ ST.GetString("linked_sing")+Sig_name;

	str=str+"<br></body></html>";
        return str;
}






void  LinkPropertyValue (string id)
{
	if(id=="reset")
		{
		if(Sig_name!="")
			{
			zxSignal zxS = cast<zxSignal>Router.GetGameObject(Sig_name);
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
			Sig_name = MO.GetName();
			}

		}
		
}



public void  SetProperties (Soup soup)
{
	inherited(soup);
	MainSpeed=soup.GetNamedTagAsFloat("MainSpeed",22.22);
	ExtraSpeed=soup.GetNamedTagAsFloat("ExtraSpeed",22.22);


	Sig_name=soup.GetNamedTag("Sig_name");


	SetNewSpeed(ExtraSpeed, true);

}

public Soup  GetProperties (void)
{
	Soup ret=inherited();
	ret.SetNamedTag("MainSpeed",MainSpeed);
	ret.SetNamedTag("ExtraSpeed",ExtraSpeed);

	ret.SetNamedTag("Sig_name",Sig_name);
	return ret;	
}



public void Init(Asset asset)
{
	inherited(asset);
	ST=asset.GetStringTable();

}


};