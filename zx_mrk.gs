include "zx_specs.gs"


class zxMarker_main isclass zxMarker
{

StringTable ST;


/*


0 прямой путь
1 отклонение
2 отклонение пологое
4 нет сковозного пропуска
8 неправильный
16 ПАБ (ЗЗ)
32 АЛС
64 неправильного с двух сторонней АБ
128 маркер "располовиненого" пути (для ЖЖЖ)
256 конец АБ
512 нет 4-значной АБ
1024 маркер направления
2048 маркер конца контролируемого участка

*/



public string GetPropertyType(string id)
{
	string ret="link";
 	if(id=="info")
		ret="string,0,200";

	return ret;
}



public string GetDescriptionHTML(void)
{
        HTMLWindow hw=HTMLWindow;
	int i;

	string[] tok = new string[13];

	tok[0] = "MRFT";
	tok[1] = "MRT";
	tok[2] = "MRT18";
	tok[3] = "MRNOPR";
	tok[4] = "MRWW";
	tok[5] = "MRPAB";
	tok[6] = "MRALS";
	tok[7] = "MRDAB";
	tok[8] = "MRHALFBL";
	tok[9] = "MRENDAB";
	tok[10] = "MREND4AB";
	tok[11] = "MRN";
	tok[12] = "MRENDCONTROL";

        string str="<html><body>";
        str=str+"<font size=\"10\" color=\"#00EFBF\"><b>"+ST.GetString("object_desc");
        str=str+"</b></font><br><br>";


        str=str+hw.StartTable("border='1' width=400");

	int q = 1;

	int mrn_Mark = 11;


	for(i=1;i<tok.size();i++)
		{
			if (i != mrn_Mark) {
				str=str+hw.StartRow();
				str=str+hw.StartCell("bgcolor='#888888' colspan=2");
				str=str+hw.CheckBox("live://property/marker_type/"+q, (trmrk_flag & q) );
				str=str+" "+hw.MakeLink("live://property/marker_type/"+q, ST.GetString("marker_type-"+i))+" "+tok[i];
				str=str+hw.EndCell();
				str=str+hw.EndRow();
			}

		q = q * 2;
        	}
	
	str=str+hw.StartRow();
        str=str+hw.StartCell("bgcolor='#888888' colspan=2");
	str=str+hw.CheckBox("live://property/marker_type/"+MRN, (trmrk_flag & MRN));
	str=str+" "+hw.MakeLink("live://property/marker_type/"+MRN, ST.GetString("marker_type-"+mrn_Mark))+" "+tok[mrn_Mark];
       	str=str+hw.EndCell();
        str=str+hw.EndRow();

	
	if(trmrk_flag & MRN)
		{
	        str=str+hw.StartRow();
        	str=str+hw.StartCell("bgcolor='#888899'");
	        str=str+hw.MakeLink("live://property/info",ST.GetString("info_desc"));
        	str=str+hw.EndCell();
	        str=str+hw.StartCell("bgcolor='#AAAAAA'");
        	str=str+hw.MakeLink("live://property/info",info);
	        str=str+hw.EndCell();
        	str=str+hw.EndRow();
	        }


        str=str+hw.EndTable();
 
	str=str+"<br></body></html>";
        return str;
}


void SetName()
	{
	string[] tok = new string[13];

	tok[0] = "MRFT";
	tok[1] = "MRT";
	tok[2] = "MRT18";
	tok[3] = "MRNOPR";
	tok[4] = "MRWW";
	tok[5] = "MRPAB";
	tok[6] = "MRALS";
	tok[7] = "MRDAB";
	tok[8] = "MRHALFBL";
	tok[9] = "MRENDAB";
	tok[10] = "MREND4AB";
	tok[11] = "MRN";
	tok[12] = "MRENDCONTROL";

	string res = "";

	if(trmrk_flag == 0)
		res = tok[0];
	else
		{
		int q = 1;
		int i;
		for(i = 1; i < tok.size(); i++)
			{
			if(trmrk_flag & q) {
				if (res != "")
					res = res + " ";
				res = res + tok[i];
				if (i == 11)
					res = res + " " + info;
			}
			q = q * 2;
			}
		}


	SetFXNameText("name0",res);	
	}







void  LinkPropertyValue (string id)
{
	string[] tok=Str.Tokens(id,"/");
	if(tok.size()==2 and tok[0] == "marker_type")
		{
		int q = Str.ToInt(tok[1]);

		trmrk_flag = trmrk_flag ^ q;

		if((trmrk_flag & MRT) and (trmrk_flag & MRT18)  )
			trmrk_flag = trmrk_flag ^ MRT18;


		SetName();
		}
}



public void SetPropertyValue(string id, string val) 
{	
	if (id=="info")
		{
		info=val;
	  	SetName();
		}
}



public void  SetProperties (Soup soup)
{
	inherited(soup);

	trmrk_flag = soup.GetNamedTagAsInt("trmrk_flag",-1);
	info = soup.GetNamedTag("info");

	if(trmrk_flag == -1)
		{
		int trmrk_mod=soup.GetNamedTagAsInt("trmrk_mod",0);

		if(trmrk_mod == 0)
			{
			if(info != "")
				trmrk_flag = MRN;
			else
				trmrk_flag = MRT;
			}
		else
			{
			trmrk_flag = 0;

			if((trmrk_mod / 10) == 1)
				trmrk_flag = trmrk_flag | MRN;
		
			trmrk_mod = trmrk_mod % 10;

			if(trmrk_mod == 1)
				trmrk_flag = trmrk_flag | MRT;

			if(trmrk_mod == 2)
				trmrk_flag = trmrk_flag | MRT18;

			if(trmrk_mod == 3)
				trmrk_flag = trmrk_flag | MRWW;

			if(trmrk_mod == 4)
				trmrk_flag = trmrk_flag | MRPAB;

			if(trmrk_mod == 5)
				trmrk_flag = trmrk_flag | MRALS;

			if(trmrk_mod == 6)
				trmrk_flag = trmrk_flag | MRDAB;

			if(trmrk_mod == 7)
				trmrk_flag = trmrk_flag | MRHALFBL;

			if(trmrk_mod == 8)
				trmrk_flag = trmrk_flag | MRENDAB;
				
			}

		}

	SetName();
}

public Soup  GetProperties (void)
{
	Soup ret=inherited();
	ret.SetNamedTag("trmrk_flag",trmrk_flag);
	ret.SetNamedTag("info",info);
	return ret;	
}


public void Init(Asset asset)
{
	inherited(asset);
	ST=asset.GetStringTable();
}
	

};