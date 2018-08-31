include "zx_specs.gs"


class zxMarker_main isclass zxMarker
{

StringTable ST;


/*


trmrk_mod
info


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
	string tp="MRFT,MRT,MRT18,MRWW,MRPAB,MRALS,MRDAB,MRHALFBL,MRENDAB,MRN";


	string[] tok=Str.Tokens(tp,",");

        string str="<html><body>";
        str=str+"<font size=\"10\" color=\"#00EFBF\"><b>"+ST.GetString("object_desc");
        str=str+"</b></font><br><br>";


        str=str+hw.StartTable("border='1' width=400");

	int q = tok.size() - 1;

	for(i=1;i<q;i++)
		{
	        str=str+hw.StartRow();
        	str=str+hw.StartCell("bgcolor='#888888' colspan=2");
		str=str+hw.RadioButton("live://property/marker_type/"+i,i == (trmrk_mod % 10) );
		str=str+" "+hw.MakeLink("live://property/marker_type/"+i, ST.GetString("marker_type-"+i))+" "+tok[i];
        	str=str+hw.EndCell();
	        str=str+hw.EndRow();
        	}
	
	str=str+hw.StartRow();
        str=str+hw.StartCell("bgcolor='#888888' colspan=2");
	str=str+hw.CheckBox("live://property/marker_type/"+10, (trmrk_mod / 10) == 1);
	str=str+" "+hw.MakeLink("live://property/marker_type/"+10, ST.GetString("marker_type-"+q))+" "+tok[q];
       	str=str+hw.EndCell();
        str=str+hw.EndRow();

	
	if((trmrk_mod / 10) == 1)
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
	string tp="MRFT,MRT,MRT18,MRWW,MRPAB,MRALS,MRDAB,MRHALFBL,MRENDAB,MRN ";
	string[] tok=Str.Tokens(tp,",");

	if( (trmrk_mod / 10) == 1 )
		SetFXNameText("name0",tok[(trmrk_mod-10)]+" "+info);
	else
		SetFXNameText("name0",tok[trmrk_mod]);	
	}







void  LinkPropertyValue (string id)
{
	string[] tok=Str.Tokens(id,"/");
	if(tok.size()==2)
		{
		int a1 = Str.ToInt(tok[1]);

		if(a1 == 10)
			{
			if((trmrk_mod / 10) == 1)
				trmrk_mod= trmrk_mod - 10;
			else
				trmrk_mod= 10;
			}
		else
			{

				trmrk_mod= 10*(int)(trmrk_mod/10)+a1;
			}

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
	trmrk_mod=soup.GetNamedTagAsInt("trmrk_mod",1);
	info=soup.GetNamedTag("info");

	SetName();
}

public Soup  GetProperties (void)
{
	Soup ret=inherited();
	ret.SetNamedTag("trmrk_mod",trmrk_mod);
	ret.SetNamedTag("info",info);
	return ret;	
}


public void Init(Asset asset)
{
	ST=asset.GetStringTable();


}
	

};