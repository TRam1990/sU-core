include "zx_specs.gs"



class zxRouter isclass GSObject
{


	public string typeMatrix="9";

	public string rulesLightsRouterSign="";
	public string rulesLightsRouterSign2="";

	public string textureName="rs_white";

	public MeshObject MainMesh;
	public MeshObject Table;

	public Asset a_source;
	public Trackside Owner;
	
	public zxSignal OwnerSignal;



	public int timeToWait=50;
	public bool ctrlDir=false;		// true - поиск светофора впереди, false - позади

	public bool permUPD=false;
	public bool WasOpen=false;



	/*
		t11 t12 t13 t14 t15
	t21 t22 t23 t24 t25
	t31 t32 t33 t34 t35
	t41 t42 t43 t44 t45
	t51 t52 t53 t54 t55
	t61 t62 t63 t64 t65
	t71 t72 t73 t74 t75	

		*/




public string GetRules(void)
	{
		string s="";
		
		if(typeMatrix=="9" or typeMatrix==""){        
			s=s+"1:m14,m23,m24,m32,m34,m44,m54,m64,m75,m72,m73,m74,m76;";
			s=s+"2:m13,m14,m15,m22,m45,m44,m53,m62,m75,m72,m73,m74,m26,m36,m76;";
			s=s+"3:m13,m14,m15,m22,m45,m44,m62,m75,m73,m74,m26,m36,m56,m66;";
			s=s+"4:m15,m25,m24,m35,m33,m45,m42,m43,m44,m55,m65,m75,m46;";
			s=s+"5:m12,m13,m14,m15,m22,m32,m45,m42,m43,m44,m62,m75,m73,m74,m16,m56,m66;";
			s=s+"6:m13,m14,m15,m22,m32,m45,m42,m43,m44,m52,m62,m75,m73,m74,m26,m56,m66;";
			s=s+"7:m12,m13,m14,m15,m45,m54,m63,m72,m16,m26,m36;";
			s=s+"8:m13,m14,m15,m22,m32,m45,m43,m44,m52,m62,m75,m73,m74,m26,m36,m56,m66;";
			s=s+"9:m13,m14,m15,m22,m32,m45,m43,m44,m62,m75,m73,m74,m26,m36,m46,m56,m66;";
			s=s+"0:m13,m14,m15,m22,m32,m42,m52,m62,m75,m73,m74,m26,m36,m46,m56,m66;";

			s=s+"A:m15,m24,m33,m42,m55,m52,m53,m54,m62,m72,m16,m26,m36,m46,m56,m66,m76;";
			s=s+"B:m12,m13,m14,m15,m22,m32,m45,m42,m43,m44,m52,m62,m75,m72,m73,m74,m16,m56,m66;";
			s=s+"V:m12,m13,m14,m15,m22,m32,m45,m42,m43,m44,m52,m62,m75,m72,m73,m74,m26,m36,m56,m66;";
			s=s+"G:m12,m13,m14,m15,m22,m32,m42,m52,m62,m72,m16;";
			s=s+"D:m14,m15,m25,m23,m35,m33,m45,m43,m55,m53,m65,m62,m63,m64,m72,m66,m76;";
			s=s+"E:m12,m13,m14,m15,m22,m32,m45,m42,m43,m44,m52,m62,m75,m72,m73,m74,m16,m76;";
			s=s+"J:m12,m22,m24,m32,m34,m45,m42,m43,m44,m52,m54,m62,m64,m72,m16,m26,m36,m46,m56,m66,m76;";
			s=s+"I:m12,m22,m35,m32,m42,m44,m52,m53,m62,m72,m16,m26,m36,m46,m56,m66,m76;";
			s=s+"K:m12,m25,m22,m32,m34,m42,m43,m52,m54,m65,m62,m72,m16,m76;";
			s=s+"L:m14,m15,m23,m33,m43,m53,m63,m72,m73,m16,m26,m36,m46,m56,m66,m76;";
			s=s+"M:m12,m25,m22,m23,m32,m34,m42,m44,m52,m62,m72,m16,m26,m36,m46,m56,m66,m76;";
			s=s+"N:m12,m22,m32,m45,m42,m43,m44,m52,m62,m72,m16,m26,m36,m46,m56,m66,m76;";
			s=s+"O:m12,m13,m14,m15,m22,m32,m42,m52,m62,m75,m72,m73,m74,m16,m26,m36,m46,m56,m66,m76;";
			s=s+"P:m12,m13,m14,m15,m22,m32,m42,m52,m62,m72,m16,m26,m36,m46,m56,m66,m76;";
			s=s+"R:m12,m13,m14,m15,m22,m32,m45,m42,m43,m44,m52,m62,m72,m26,m36;";
			s=s+"S:m13,m14,m15,m22,m32,m42,m52,m62,m75,m73,m74,m16,m76;";
			s=s+"T:m12,m13,m14,m15,m24,m34,m44,m54,m64,m74,m16;";
			s=s+"U:m12,m22,m32,m45,m43,m44,m75,m73,m74,m16,m26,m36,m46,m56,m66;";
			s=s+"F:m13,m14,m15,m22,m24,m32,m34,m42,m44,m55,m53,m54,m64,m74,m26,m36,m46;";
			s=s+"H:m12,m25,m23,m35,m33,m44,m55,m53,m65,m63,m72,m16,m76;";
			s=s+"C:m12,m22,m32,m42,m52,m65,m62,m63,m64,m16,m26,m36,m46,m56,m66,m76;";
			s=s+"Q:m12,m22,m32,m45,m43,m44,m16,m26,m36,m46,m56,m66,m76;";		//Ч
			s=s+"X:m12,m22,m32,m42,m44,m52,m54,m62,m64,m75,m72,m73,m74,m16,m26,m36,m46,m56,m66,m76;"; //Ш
			s=s+"e:m12,m13,m14,m15,m45,m43,m44,m75,m72,m73,m74,m26,m36,m46,m56,m66;"; //Э
			s=s+"Y:m12,m15,m22,m24,m32,m34,m42,m43,m44,m52,m54,m62,m64,m75,m72,m26,m36,m46,m56,m66;"; //Ю
			s=s+"Z:m13,m14,m15,m22,m32,m45,m43,m44,m53,m62,m72,m16,m26,m36,m46,m56,m66,m76;"; //Я

			s=s+"a:m13,m14,m15,m24,m34,m44,m54,m64,m75,m73,m74;";
			s=s+"b:m12,m13,m14,m15,m25,m23,m35,m33,m45,m43,m55,m53,m65,m63,m75,m72,m73,m74,m16,m76;";
			s=s+"c:m12,m14,m22,m24,m32,m34,m42,m44,m52,m54,m62,m64,m72,m74,m16,m26,m36,m46,m56,m66,m76;";
			s=s+"d:m12,m14,m22,m24,m32,m34,m42,m44,m52,m54,m62,m64,m75,m72,m16,m26,m36,m46,m56,m66;";

			s=s+"l:m22,m33,m44,m55,m66;";
			s=s+"f:m14,m24,m34,m44,m54,m64,m74;";
			s=s+"r:m35,m44,m53,m62,m26;";
			s=s+"h:m45,m42,m43,m44,m46;";
		}else
		if(typeMatrix=="19"){
			s=s+"1:m15,m25,m24,m35,m45,m55,m65,m75,m74,m76;";
			s=s+"2:m14,m15,m23,m55,m64,m75,m73,m74,m26,m36,m46,m76;";
			s=s+"3:m14,m15,m23,m45,m63,m75,m74,m26,m36,m56,m66;";
			s=s+"4:m13,m23,m33,m45,m43,m44,m16,m26,m36,m46,m56,m66,m76;";
			s=s+"5:m13,m14,m15,m23,m35,m33,m34,m63,m75,m74,m16,m46,m56,m66;";
			s=s+"6:m14,m15,m23,m33,m45,m43,m44,m53,m63,m75,m74,m16,m56,m66;";
			s=s+"7:m13,m14,m15,m35,m44,m54,m64,m74,m16,m26;";
			s=s+"8:m14,m15,m23,m33,m45,m44,m53,m63,m75,m74,m26,m36,m56,m66;";
			s=s+"9:m14,m15,m23,m33,m45,m44,m63,m75,m74,m26,m36,m46,m56,m66;";
			s=s+"0:m14,m15,m23,m33,m43,m53,m63,m75,m74,m26,m36,m46,m56,m66;";

		} else if(typeMatrix=="99"){
			s=s+"1:mb13,mb22,mb23,mb33,mb43,mb53,mb63,mb72,mb73,mb74;";
			s=s+"2:mb12,mb13,mb14,mb25,mb21,mb35,mb44,mb53,mb62,mb75,mb71,mb72,mb73,mb74;";
			s=s+"3:mb12,mb13,mb14,mb25,mb21,mb35,mb43,mb44,mb55,mb65,mb61,mb72,mb73,mb74;";
			s=s+"4:mb11,mb14,mb21,mb24,mb31,mb34,mb45,mb41,mb42,mb43,mb44,mb54,mb64,mb74;";
			s=s+"5:mb11,mb12,mb13,mb14,mb15,mb21,mb31,mb41,mb42,mb43,mb44,mb55,mb65,mb71,mb72,mb73,mb74;";
			s=s+"6:mb12,mb13,mb14,mb25,mb21,mb31,mb41,mb42,mb43,mb44,mb55,mb51,mb65,mb61,mb72,mb73,mb74;";
			s=s+"7:mb11,mb12,mb13,mb14,mb15,mb25,mb34,mb43,mb53,mb63,mb73;";
			s=s+"8:mb12,mb13,mb14,mb25,mb21,mb35,mb31,mb42,mb43,mb44,mb55,mb51,mb65,mb61,mb72,mb73,mb74;";
			s=s+"9:mb12,mb13,mb14,mb25,mb21,mb35,mb31,mb45,mb42,mb43,mb44,mb55,mb65,mb72,mb73,mb74;";
			s=s+"0:mb12,mb13,mb14,mb25,mb21,mb35,mb31,mb45,mb41,mb55,mb51,mb65,mb61,mb72,mb73,mb74;";

			s=s+"A:mb14,mb15,mb25,mb23,mb35,mb32,mb45,mb41,mb42,mb43,mb44,mb55,mb51,mb65,mb61,mb75,mb71;";
			s=s+"B:mb11,mb12,mb13,mb14,mb15,mb21,mb31,mb41,mb42,mb43,mb44,mb55,mb51,mb65,mb61,mb71,mb72,mb73,mb74;";
			s=s+"V:mb11,mb12,mb13,mb14,mb25,mb21,mb35,mb31,mb41,mb42,mb43,mb44,mb55,mb51,mb65,mb61,mb71,mb72,mb73,mb74;";
			s=s+"G:mb11,mb12,mb13,mb14,mb15,mb21,mb31,mb41,mb51,mb61,mb71;";
			s=s+"D:mb13,mb14,mb22,mb24,mb32,mb34,mb42,mb44,mb52,mb54,mb65,mb61,mb62,mb63,mb64,mb75,mb71;";
			s=s+"E:mb11,mb12,mb13,mb14,mb15,mb21,mb31,mb41,mb42,mb43,mb44,mb51,mb61,mb75,mb71,mb72,mb73,mb74;";
			s=s+"J:mb11,mb15,mb25,mb21,mb23,mb35,mb31,mb33,mb45,mb41,mb42,mb43,mb44,mb55,mb51,mb53,mb65,mb61,mb63,mb75,mb71;";
			s=s+"I:mb11,mb15,mb25,mb21,mb35,mb31,mb34,mb45,mb41,mb43,mb55,mb51,mb52,mb65,mb61,mb75,mb71;";
			s=s+"K:mb11,mb15,mb21,mb24,mb31,mb33,mb41,mb42,mb51,mb53,mb61,mb64,mb75,mb71;";
			s=s+"L:mb13,mb14,mb15,mb25,mb22,mb35,mb32,mb45,mb42,mb55,mb52,mb65,mb62,mb75,mb71;";
			s=s+"M:mb11,mb15,mb25,mb21,mb22,mb24,mb35,mb31,mb33,mb45,mb41,mb43,mb55,mb51,mb65,mb61,mb75,mb71;";
			s=s+"N:mb11,mb15,mb25,mb21,mb35,mb31,mb45,mb41,mb42,mb43,mb44,mb55,mb51,mb65,mb61,mb75,mb71;";
			s=s+"O:mb11,mb12,mb13,mb14,mb15,mb25,mb21,mb35,mb31,mb45,mb41,mb55,mb51,mb65,mb61,mb75,mb71,mb72,mb73,mb74;";
			s=s+"P:mb11,mb12,mb13,mb14,mb15,mb25,mb21,mb35,mb31,mb45,mb41,mb55,mb51,mb65,mb61,mb75,mb71;";
			s=s+"R:mb11,mb12,mb13,mb14,mb25,mb21,mb35,mb31,mb41,mb42,mb43,mb44,mb51,mb61,mb71;";
			s=s+"S:mb12,mb13,mb14,mb15,mb21,mb31,mb41,mb51,mb61,mb75,mb72,mb73,mb74;";
			s=s+"T:mb11,mb12,mb13,mb14,mb15,mb23,mb33,mb43,mb53,mb63,mb73;";
			s=s+"U:mb11,mb15,mb25,mb21,mb35,mb31,mb45,mb42,mb43,mb44,mb55,mb65,mb71,mb72,mb73,mb74;";
			s=s+"F:mb13,mb25,mb21,mb22,mb23,mb24,mb35,mb31,mb33,mb45,mb41,mb43,mb55,mb51,mb52,mb53,mb54,mb63,mb73;";
			s=s+"H:mb11,mb15,mb22,mb24,mb32,mb33,mb34,mb43,mb52,mb53,mb54,mb65,mb62,mb64,mb75,mb71;";
			s=s+"C:mb11,mb14,mb21,mb24,mb31,mb34,mb41,mb44,mb51,mb54,mb65,mb61,mb62,mb63,mb64,mb75;";
			s=s+"Q:mb11,mb15,mb25,mb21,mb35,mb31,mb45,mb42,mb43,mb44,mb55,mb65,mb75;"; //Ч
			s=s+"X:mb11,mb15,mb25,mb21,mb35,mb31,mb45,mb41,mb43,mb55,mb51,mb53,mb65,mb61,mb63,mb75,mb71,mb72,mb73,mb74;"; //Ш
			s=s+"e:mb11,mb12,mb13,mb14,mb25,mb35,mb45,mb42,mb43,mb44,mb55,mb65,mb71,mb72,mb73,mb74;"; //Э
			s=s+"Y:mb11,mb14,mb25,mb21,mb23,mb35,mb31,mb33,mb45,mb41,mb42,mb43,mb55,mb51,mb53,mb65,mb61,mb63,mb71,mb74;"; //Ю
			s=s+"Z:mb12,mb13,mb14,mb15,mb25,mb21,mb35,mb31,mb45,mb42,mb43,mb44,mb55,mb52,mb65,mb61,mb75,mb71;";

			s=s+"l:mb21,mb32,mb43,mb54,mb65;";
			s=s+"f:mb13,mb23,mb33,mb43,mb53,mb63,mb73;";
			s=s+"r:mb25,mb34,mb43,mb52,mb61;";
			s=s+"h:mb45,mb41,mb42,mb43,mb44;";
		}else
		if(typeMatrix=="x"){        
			s=s+"r:ur1,ur2,ur3,u0,ur4,ur5,ur6;";
			s=s+"l:ul1,ul2,ul3,u0,ul4,ul5,ul6;";
			s=s+"f:uv1,uv2,u0,uv3,uv4;";
			s=s+"h:uh1,uh2,u0,uh3,uh4;";
			s=s+"e:ul2,uv1,ur2,uh4,ul5,uv4,ur5,uh3,u0;";
		}
		
		
		return s;
	}




public string GetRules2(void)
	{
		string s="";
		if(typeMatrix=="19"){
			s=s+"1:m11,m21,m31,m41,m51,m61,m71;"; //Для левого ряда
		}else
		if(typeMatrix=="99"){
			s=s+"1:ma13,ma22,ma23,ma33,ma43,ma53,ma63,ma72,ma73,ma74;";
			s=s+"2:ma12,ma13,ma14,ma25,ma21,ma35,ma44,ma53,ma62,ma75,ma71,ma72,ma73,ma74;";
			s=s+"3:ma12,ma13,ma14,ma25,ma21,ma35,ma43,ma44,ma55,ma65,ma61,ma72,ma73,ma74;";
			s=s+"4:ma11,ma14,ma21,ma24,ma31,ma34,ma45,ma41,ma42,ma43,ma44,ma54,ma64,ma74;";
			s=s+"5:ma11,ma12,ma13,ma14,ma15,ma21,ma31,ma41,ma42,ma43,ma44,ma55,ma65,ma71,ma72,ma73,ma74;";
			s=s+"6:ma12,ma13,ma14,ma25,ma21,ma31,ma41,ma42,ma43,ma44,ma55,ma51,ma65,ma61,ma72,ma73,ma74;";
			s=s+"7:ma11,ma12,ma13,ma14,ma15,ma25,ma34,ma43,ma53,ma63,ma73;";
			s=s+"8:ma12,ma13,ma14,ma25,ma21,ma35,ma31,ma42,ma43,ma44,ma55,ma51,ma65,ma61,ma72,ma73,ma74;";
			s=s+"9:ma12,ma13,ma14,ma25,ma21,ma35,ma31,ma45,ma42,ma43,ma44,ma55,ma65,ma72,ma73,ma74;";
			s=s+"0:ma12,ma13,ma14,ma25,ma21,ma35,ma31,ma45,ma41,ma55,ma51,ma65,ma61,ma72,ma73,ma74;";

			s=s+"A:ma14,ma15,ma25,ma23,ma35,ma32,ma45,ma41,ma42,ma43,ma44,ma55,ma51,ma65,ma61,ma75,ma71;";
			s=s+"B:ma11,ma12,ma13,ma14,ma15,ma21,ma31,ma41,ma42,ma43,ma44,ma55,ma51,ma65,ma61,ma71,ma72,ma73,ma74;";
			s=s+"V:ma11,ma12,ma13,ma14,ma25,ma21,ma35,ma31,ma41,ma42,ma43,ma44,ma55,ma51,ma65,ma61,ma71,ma72,ma73,ma74;";
			s=s+"G:ma11,ma12,ma13,ma14,ma15,ma21,ma31,ma41,ma51,ma61,ma71;";
			s=s+"D:ma13,ma14,ma22,ma24,ma32,ma34,ma42,ma44,ma52,ma54,ma65,ma61,ma62,ma63,ma64,ma75,ma71;";
			s=s+"E:ma11,ma12,ma13,ma14,ma15,ma21,ma31,ma41,ma42,ma43,ma44,ma51,ma61,ma75,ma71,ma72,ma73,ma74;";
			s=s+"J:ma11,ma15,ma25,ma21,ma23,ma35,ma31,ma33,ma45,ma41,ma42,ma43,ma44,ma55,ma51,ma53,ma65,ma61,ma63,ma75,ma71;";
			s=s+"I:ma11,ma15,ma25,ma21,ma35,ma31,ma34,ma45,ma41,ma43,ma55,ma51,ma52,ma65,ma61,ma75,ma71;";
			s=s+"K:ma11,ma15,ma21,ma24,ma31,ma33,ma41,ma42,ma51,ma53,ma61,ma64,ma75,ma71;";
			s=s+"L:ma13,ma14,ma15,ma25,ma22,ma35,ma32,ma45,ma42,ma55,ma52,ma65,ma62,ma75,ma71;";
			s=s+"M:ma11,ma15,ma25,ma21,ma22,ma24,ma35,ma31,ma33,ma45,ma41,ma43,ma55,ma51,ma65,ma61,ma75,ma71;";
			s=s+"N:ma11,ma15,ma25,ma21,ma35,ma31,ma45,ma41,ma42,ma43,ma44,ma55,ma51,ma65,ma61,ma75,ma71;";
			s=s+"O:ma11,ma12,ma13,ma14,ma15,ma25,ma21,ma35,ma31,ma45,ma41,ma55,ma51,ma65,ma61,ma75,ma71,ma72,ma73,ma74;";
			s=s+"P:ma11,ma12,ma13,ma14,ma15,ma25,ma21,ma35,ma31,ma45,ma41,ma55,ma51,ma65,ma61,ma75,ma71;";
			s=s+"R:ma11,ma12,ma13,ma14,ma25,ma21,ma35,ma31,ma41,ma42,ma43,ma44,ma51,ma61,ma71;";
			s=s+"S:ma12,ma13,ma14,ma15,ma21,ma31,ma41,ma51,ma61,ma75,ma72,ma73,ma74;";
			s=s+"T:ma11,ma12,ma13,ma14,ma15,ma23,ma33,ma43,ma53,ma63,ma73;";
			s=s+"U:ma11,ma15,ma25,ma21,ma35,ma31,ma45,ma42,ma43,ma44,ma55,ma65,ma71,ma72,ma73,ma74;";
			s=s+"F:ma13,ma25,ma21,ma22,ma23,ma24,ma35,ma31,ma33,ma45,ma41,ma43,ma55,ma51,ma52,ma53,ma54,ma63,ma73;";
			s=s+"H:ma11,ma15,ma22,ma24,ma32,ma33,ma34,ma43,ma52,ma53,ma54,ma65,ma62,ma64,ma75,ma71;";
			s=s+"C:ma11,ma14,ma21,ma24,ma31,ma34,ma41,ma44,ma51,ma54,ma65,ma61,ma62,ma63,ma64,ma75;";
			s=s+"Q:ma11,ma15,ma25,ma21,ma35,ma31,ma45,ma42,ma43,ma44,ma55,ma65,ma75;"; //Ч
			s=s+"X:ma11,ma15,ma25,ma21,ma35,ma31,ma45,ma41,ma43,ma55,ma51,ma53,ma65,ma61,ma63,ma75,ma71,ma72,ma73,ma74;"; //Ш
			s=s+"e:ma11,ma12,ma13,ma14,ma25,ma35,ma45,ma42,ma43,ma44,ma55,ma65,ma71,ma72,ma73,ma74;"; //Э
			s=s+"Y:ma11,ma14,ma25,ma21,ma23,ma35,ma31,ma33,ma45,ma41,ma42,ma43,ma55,ma51,ma53,ma65,ma61,ma63,ma71,ma74;"; //Ю
			s=s+"Z:ma12,ma13,ma14,ma15,ma25,ma21,ma35,ma31,ma45,ma42,ma43,ma44,ma55,ma52,ma65,ma61,ma75,ma71;";
		}
		return s;
	}



public void OffLightsRouterSign(void)
	{
		string 	s="m11,m12,m13,m14,m15,m16,";
		s=s+"m21,m22,m23,m24,m25,m26,";
		s=s+"m31,m32,m33,m34,m35,m36,";
		s=s+"m41,m42,m43,m44,m45,m46,";
		s=s+"m51,m52,m53,m54,m55,m56,";
		s=s+"m61,m62,m63,m64,m65,m66,";
		s=s+"m71,m72,m73,m74,m75,m76,";
		s=s+"ma11,ma12,ma13,ma14,ma15,";
		s=s+"ma21,ma22,ma23,ma24,ma25,";
		s=s+"ma31,ma32,ma33,ma34,ma35,";
		s=s+"ma41,ma42,ma43,ma44,ma45,";
		s=s+"ma51,ma52,ma53,ma54,ma55,";
		s=s+"ma61,ma62,ma63,ma64,ma65,";
		s=s+"ma71,ma72,ma73,ma74,ma75,";
		s=s+"mb11,mb12,mb13,mb14,mb15,";
		s=s+"mb21,mb22,mb23,mb24,mb25,";
		s=s+"mb31,mb32,mb33,mb34,mb35,";
		s=s+"mb41,mb42,mb43,mb44,mb45,";
		s=s+"mb51,mb52,mb53,mb54,mb55,";
		s=s+"mb61,mb62,mb63,mb64,mb65,";
		s=s+"mb71,mb72,mb73,mb74,mb75,";
		s=s+"ur1,ur2,ur3,u0,ur4,ur5,ur6,";
		s=s+"ul1,ul2,ul3,u0,ul4,ul5,ul6,";
		s=s+"uv1,uv2,u0,uv3,uv4,";
		s=s+"uh1,uh2,u0,uh3,uh4";

		string[] tok1=Str.Tokens(s,",");
		int i=0;
		for(;i<tok1.size();i++)
			{
			MainMesh.SetFXAttachment(tok1[i],null);
			}
		
	}

public void OnLightsRouterSign(string code)
	{
		string code1="",code2="";
		if(code.size()>1)
			{
			code1=code[1,2];
			code2=code[0,1];
			}
		else
			{
			code1=code;
			}

		if(MainMesh)
			{
			OffLightsRouterSign();

			if( code=="")
				return;


			Asset lightRouterSign=a_source.FindAsset(textureName);

			string[] tok1=Str.Tokens(rulesLightsRouterSign,";"); // число отображаемых знаков на указателе
			int i=0;
			for(;i<tok1.size();i++)
				{
				string[] tok2=Str.Tokens(tok1[i],":");      
				if(code1==tok2[0])
					{
					int j=0;
					string[] tok3=Str.Tokens(tok2[1],",");
					for(;j<tok3.size();j++)
						MainMesh.SetFXAttachment(tok3[j],lightRouterSign);
					break;
					}
				}

			if(code2!="")
				{
				string[] tok1=Str.Tokens(rulesLightsRouterSign2,";");
				int i=0;
				for(;i<tok1.size();i++)
					{
					string[] tok2=Str.Tokens(tok1[i],":");    
					if(code2==tok2[0])
						{
						int j=0;
						string[] tok3=Str.Tokens(tok2[1],",");
						for(;j<tok3.size();j++)
							MainMesh.SetFXAttachment(tok3[j],lightRouterSign);

						break;
						}
					}
				}
			}
	}





public void SetTypeMatrix()
	{
		if(typeMatrix=="9" or typeMatrix=="")
			{
			rulesLightsRouterSign=GetRules();
			rulesLightsRouterSign2="";
			Table = Owner.SetFXAttachment("att0",a_source.FindAsset("matrix9"));
			}
		else if(typeMatrix=="19")
			{
			rulesLightsRouterSign=GetRules();
			rulesLightsRouterSign2=GetRules2();
			Table = Owner.SetFXAttachment("att0",a_source.FindAsset("matrix19"));
			}
		else if(typeMatrix=="99")
			{
			rulesLightsRouterSign=GetRules();
			rulesLightsRouterSign2=GetRules2();
			Table = Owner.SetFXAttachment("att0",a_source.FindAsset("matrix99"));
			}
		else if(typeMatrix=="x")
			{
			rulesLightsRouterSign=GetRules();
			rulesLightsRouterSign2=GetRules2();
			Table = Owner.SetFXAttachment("att0",a_source.FindAsset("matrixx"));
			}
	}






public bool FindSignalState(zxSignal temp)
	{
	if(!temp)
		return false;

	int OwnState=temp.MainState;

	if(OwnState == 0 or OwnState == 1 or OwnState == 2 or OwnState == 19)
		return false;

	return true;
	}



public zxSignal FindOwnerSignal(bool ToJunction)
	{


	GSTrackSearch GS=Owner.BeginTrackSearch(ctrlDir);
	MapObject mo=GS.SearchNext();
	while(mo and !( mo.isclass(Junction) and ToJunction )  )
		{

//Interface.Log(mo.GetName());

		bool dir=GS.GetFacingRelativeToSearchDirection();
		if(mo.isclass(zxSignal) and dir==ctrlDir)
			{
			int stype=(cast<zxSignal>mo).Type;

			if( stype>0 and ((stype & (zxSignal.ST_IN | zxSignal.ST_OUT | zxSignal.ST_ROUTER)) or  ((stype & zxSignal.ST_PERMOPENED) and !(stype & zxSignal.ST_UNLINKED))) )
				{
				return cast<zxSignal>mo;
				}
			}
		mo=GS.SearchNext();	
		}

	return null;
	}



public string FindMRN(zxSignal sign)
	{

	bool dir=true;

	if(textureName=="rs_green")
		dir=false;

	GSTrackSearch GS = sign.BeginTrackSearch(dir);

	MapObject mo=GS.SearchNext();
	string ret="";


	while(mo)
		{
		bool dir2=GS.GetFacingRelativeToSearchDirection();

		if(mo.isclass(zxSignal) and (dir == dir2) ) 
			{
			int stype=(cast<zxSignal>mo).Type;

			if( stype>0 and ((stype & (zxSignal.ST_IN | zxSignal.ST_OUT | zxSignal.ST_ROUTER)) or  ((stype & zxSignal.ST_PERMOPENED) and !(stype & zxSignal.ST_UNLINKED))) )
				{
				break;
				}
				
			}
		else if(mo.isclass(zxMarker) and (GS.GetFacingRelativeToSearchDirection() == dir ) )
			{
			if(  (cast<zxMarker>mo).trmrk_flag &  zxMarker.MRN)
				{
				ret=(cast<zxMarker>mo).info;       		
				}
			}
		mo=GS.SearchNext();        	
		}


Interface.Print("ret is "+ret);

	return ret;
	}





public void UpdateMU()
	{

	if(FindSignalState(OwnerSignal))
		{
		OnLightsRouterSign(FindMRN(OwnerSignal));
		WasOpen = true;
		}
	else if(WasOpen)
		{
		Owner.PostMessage(Owner,"UpdateMU","Off",timeToWait);
		}
	}


public void OffMU()
	{
	WasOpen=false;

	if(OwnerSignal)
		{
		if(!FindSignalState(OwnerSignal))
			{
			OnLightsRouterSign("");
			}
		}
	else
		{
		zxSignal temp1 = FindOwnerSignal(false);
	
		if(!temp1 or !FindSignalState(temp1))
			{
			OnLightsRouterSign("");
			}
		}
	}



public void PermUpdate()
	{
	zxSignal temp1 = FindOwnerSignal(false);

	if(temp1 and FindSignalState(temp1))
		{
		OnLightsRouterSign(FindMRN(temp1));
		WasOpen = true;
		}
	else if(WasOpen)
		{
		Owner.PostMessage(Owner,"UpdateMU","Off",timeToWait);
		}
	if(!OwnerSignal)
		Owner.PostMessage(Owner,"UpdateMU","PermUpdate",5);
	}


public void Init()
	{
	a_source = Owner.GetAsset();
	MainMesh = Owner.SetFXAttachment("router",a_source.FindAsset("points"));

	SetTypeMatrix();

	}



public void Remove()
	{

	OffLightsRouterSign();
	Owner.SetFXAttachment("att0",null);
	Owner.SetFXAttachment("router",null);
	}



public void SetProperties(Soup db) 
	{
	ctrlDir=db.GetNamedTagAsBool("ctrlDir",false);
	timeToWait=db.GetNamedTagAsInt("timeToWait",50);


	textureName=db.GetNamedTag("colorRSign");
	if(textureName=="")
		textureName="rs_white";
	
	typeMatrix = db.GetNamedTag("typeMatrix");
	if(typeMatrix=="")
		typeMatrix="9";
	}




public Soup GetProperties(Soup sp) 
	{
	sp.SetNamedTag("colorRSign",textureName);

	sp.SetNamedTag("ctrlDir",ctrlDir);
	sp.SetNamedTag("typeMatrix",typeMatrix);
	sp.SetNamedTag("timeToWait",timeToWait);

	return sp;
	}




};



class zxRouterBase isclass Trackside
{


StringTable ST;
string privateName="";
bool IsInited=false;
string signal_name="";

bool isMacht;

zxRouter RouterO;
Asset tabl_m,tex;


Library mainLib;

float displacement;

float def_displ;

float vert_displ;
float along_displ;


public void ShowName(bool reset);



void UpdateMU(Message msg)
{
	if(signal_name!="" and !RouterO.OwnerSignal)
		RouterO.OwnerSignal= cast<zxSignal>Router.GetGameObject(signal_name);
		

	RouterO.UpdateMU();
}

void OffMU(Message msg)
{
	RouterO.OffMU();
}

void PermUpdate(Message msg)
	{
	if(signal_name!="" and !RouterO.OwnerSignal)
		RouterO.OwnerSignal= cast<zxSignal>Router.GetGameObject(signal_name);

	if(!RouterO.OwnerSignal)
		RouterO.PermUpdate();
	}

public void Init(Asset self)
	{
	inherited(self);
	ST=me.GetAsset().GetStringTable();
	RouterO = new zxRouter();
	RouterO.Owner=me;

	KUID utilLibKUID = self.LookupKUIDTable("main_lib");
        mainLib = World.GetLibrary(utilLibKUID);

	tex=self.FindAsset("tex_tabl");
	tabl_m=self.FindAsset("tabl");

	if(ST.GetString("is_macht") == "1")
		{
		isMacht = true;
		}

	}



thread void SetSoup()
	{
	RouterO.Init();

	if(!RouterO.OwnerSignal and !RouterO.permUPD)
		{
		RouterO.permUPD=true;
		AddHandler(me,"UpdateMU","PermUpdate","PermUpdate");
		PostMessage(me,"UpdateMU","PermUpdate",5);
		}

	AddHandler(me,"UpdateMU","Update","UpdateMU");
	AddHandler(me,"UpdateMU","Off","OffMU");

	}


public void SetProperties(Soup db) 
	{
	inherited(db);


	if(IsInited)
		return;
	IsInited=true;

	RouterO.SetProperties(db);

	privateName = db.GetNamedTag("privateName");
	ShowName(false);

	signal_name = db.GetNamedTag("Signal");
	if(signal_name!="")
		{
		RouterO.OwnerSignal= cast<zxSignal>Router.GetGameObject(signal_name);
		}


	displacement = db.GetNamedTagAsFloat("displacement",0);

	def_displ = db.GetNamedTagAsFloat("def_displ",0);
	if(def_displ == 0)
		{
		def_displ = GetAsset().GetConfigSoup().GetNamedTagAsFloat("trackside",0);

		displacement = def_displ;
		}


	vert_displ = db.GetNamedTagAsFloat("vert_displ",0);
	along_displ = db.GetNamedTagAsFloat("along_displ",0);

	SetMeshTranslation("default", displacement-def_displ, along_displ, vert_displ);



	SetSoup();	
	}




public Soup GetProperties(void) 
	{
	Soup sp;
	sp=inherited();

	RouterO.GetProperties(sp);

	sp.SetNamedTag("privateName",privateName);
	sp.SetNamedTag("Inited",true);

	sp.SetNamedTag("Signal",signal_name);


	sp.SetNamedTag("displacement",displacement);
	sp.SetNamedTag("def_displ",def_displ);
	sp.SetNamedTag("vert_displ",vert_displ);
	sp.SetNamedTag("along_displ",along_displ);
		
		
	return sp;
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


	if(!isMacht and n_tabl>=3)
		{
		while(tabl[q]<22 and q<n_tabl )
			q++;

		if(q < n_tabl)
			{
			while(tabl[q]>=22 and tabl[q]!=37 and q<n_tabl )
				q++;
			
			if(tabl[q]==37)
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


public string GetCntName(void)
	{
	string s="";
	HTMLWindow hw=HTMLWindow;

	s=s+hw.StartTable("border='1' width=300");
	s=s+hw.StartRow();
	s=s+hw.StartCell("bgcolor='#666666'");
	s=s+hw.MakeLink("live://property/private-name",  ST.GetString("private_name"));
	s=s+hw.EndCell();
	s=s+hw.StartCell("bgcolor='#AAAAAA'");
	s=s+hw.MakeLink("live://property/private-name",privateName);
	s=s+hw.EndCell();
	s=s+hw.EndRow();
	s=s+hw.StartRow();

	s=s+hw.EndTable()+"<br>";
	return s;
	}



public string GetExtraSetTable()
{
	HTMLWindow hw=HTMLWindow;
	string s="";

       s=s+hw.StartTable("border='1' width='90%'");

	s=s+hw.StartRow();
	s=s+hw.MakeCell(hw.MakeLink("live://property/displace",  ST.GetString("displace")),"bgcolor='#666666' colspan='6'");
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
	s=s+hw.MakeCell(hw.MakeLink("live://property/vert_displ",  ST.GetString("vert_displ")),"bgcolor='#666666'");
	s=s+hw.MakeCell(hw.MakeLink("live://property/vert_displ",   vert_displ ),"bgcolor='#AAAAAA'  align='center' ");
	s=s+hw.EndRow();


	s=s+hw.StartRow();
	s=s+hw.MakeCell(hw.MakeLink("live://property/along_displ",  ST.GetString("along_displ")),"bgcolor='#666666'");
	s=s+hw.MakeCell(hw.MakeLink("live://property/along_displ",   along_displ ),"bgcolor='#AAAAAA'  align='center' ");
	s=s+hw.EndRow();

	s=s+hw.EndTable();
	s=s+"<br>";

	return s;
}


public string GetContent(void)
	{
	string s="<br>";
	HTMLWindow hw=HTMLWindow;

	s=s+GetCntName();

	s=s+hw.StartTable("border='1' width=300");


	s=s+hw.StartRow();
	s=s+hw.StartCell("bgcolor='#888888'");
	s=s+hw.MakeLink("live://property/link_to",ST.GetString("link_to_signal"));
	s=s+hw.EndCell();
	s=s+hw.StartCell("bgcolor='#AAAAAA'");
	s=s+signal_name;
	s=s+hw.EndCell();
	s=s+hw.EndRow();


	s=s+hw.StartRow();
	s=s+hw.StartCell();
	s=s+" ";
	s=s+hw.EndCell();
	s=s+hw.EndRow();

	s=s+hw.StartRow();
	s=s+hw.StartCell("bgcolor='#888888'");
	s=s+hw.MakeLink("live://property/color_rsign",ST.GetString("color_rsign_desc"));
	s=s+hw.EndCell();
	s=s+hw.StartCell("bgcolor='#AAAAAA'");
	string texAssetName=ST.GetString("color_rsign_"+RouterO.textureName);
	s=s+hw.MakeLink("live://property/color_rsign",texAssetName );
	s=s+hw.EndCell();
	s=s+hw.EndRow();



	s=s+hw.StartRow();
	s=s+hw.StartCell("bgcolor='#888888'");
	s=s+ST.GetString("control_dir_desc");
	s=s+hw.EndCell();
	s=s+hw.StartCell("bgcolor='#AAAAAA'");

	string ctrlDir1;

	if(RouterO.ctrlDir)
		ctrlDir1=ST.GetString("control_dir_f");
	else
		ctrlDir1=ST.GetString("control_dir_b");


	s=s+hw.MakeLink("live://property/control_dir",ctrlDir1 );
	s=s+hw.EndCell();
	s=s+hw.EndRow();

	s=s+hw.StartRow();
	s=s+hw.StartCell("bgcolor='#888888'");
	s=s+hw.MakeLink("live://property/type_matrix",ST.GetString("type_matrix"));
	s=s+hw.EndCell();
	s=s+hw.StartCell("bgcolor='#AAAAAA'");
	string ctrlMatrix=ST.GetString("typematrix_"+RouterO.typeMatrix);
	s=s+hw.MakeLink("live://property/type_matrix",ctrlMatrix );
	s=s+hw.EndCell();
	s=s+hw.EndRow();


	s=s+hw.StartRow();
	s=s+hw.StartCell("bgcolor='#888888'");
	s=s+hw.MakeLink("live://property/twait",ST.GetString("twait"));
	s=s+hw.EndCell();
	s=s+hw.StartCell("bgcolor='#AAAAAA'");
	s=s+hw.MakeLink("live://property/twait",RouterO.timeToWait );
	s=s+hw.EndCell();
	s=s+hw.EndRow();

		
	s=s+hw.StartRow();
	s=s+hw.StartCell("bgcolor='#888888'");
	s=s+hw.MakeLink("live://property/state_rs","state");
	s=s+hw.EndCell();
	s=s+hw.StartCell("bgcolor='#AAAAAA'");
	s=s+hw.MakeLink("live://property/state_rs","");
	s=s+hw.EndCell();
	s=s+hw.EndRow();
		
	s=s+hw.EndTable()+"<br>";

	s=s+GetExtraSetTable();

	return s;
	}


public string GetDescriptionHTML(void)
	{
	string str;
	str="<html><body>";
	str=str+"<font size=\"10\" color=\"#00EFBF\"><b>"+ST.GetString("object_desc")+"</b></font><br>";
	str=str+GetContent();
	str=str+"</body></html>";
	return str;
	}



public string GetPropertyType(string id) 
	{
	string ret="link";

	if (id=="private-name")
		ret="string,0,20"; 
		
	else if(id=="state_rs")
		ret="string,0,2";

	else if (id=="twait")
		ret="int,0,500,1";

	else if(id=="displace" or id=="vert_displ")
		{
		ret="float,-10,10,0.05";
		}
	else if(id=="along_displ")
		{
		ret="float,-100,100,0.1";
		}

	return ret;
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
}

public void LinkPropertyValue(string id)
	{
	inherited(id);
	if (id=="color_rsign")
		{
		if(RouterO.textureName=="rs_green")
			RouterO.textureName="rs_white";
		else
			RouterO.textureName="rs_green";
				
		RouterO.UpdateMU();
		}

	else if(id=="control_dir")
		{
		RouterO.ctrlDir = !RouterO.ctrlDir;
				
		}
	else if(id=="type_matrix")
		{
		if(RouterO.typeMatrix=="9")
			RouterO.typeMatrix="19";
		else if(RouterO.typeMatrix=="19")
			RouterO.typeMatrix="99";
		else if(RouterO.typeMatrix=="99")
			RouterO.typeMatrix="x";
		else
			RouterO.typeMatrix="9";

		RouterO.SetTypeMatrix();
		}
	else if(id=="link_to")
		{
		if(RouterO.OwnerSignal)
			RouterO.OwnerSignal.SetLinkedMU(null);

		RouterO.OwnerSignal = RouterO.FindOwnerSignal(true);


		if(RouterO.OwnerSignal)
			{
			signal_name=RouterO.OwnerSignal.GetName();
			RouterO.OwnerSignal.SetLinkedMU(me);
			}
		else
			signal_name="";

		RouterO.UpdateMU();
		}
	else
		{
		string[] str_a = Str.Tokens(id+"","/");

		if(str_a[0]=="displace1")
			{
 			displacement=Str.ToFloat(str_a[1]);
			SetMeshTranslation("default", displacement-def_displ, along_displ, vert_displ);
			}
		}

	}



public void SetPropertyValue(string id, int val)
	{
	inherited(id,val);
	if(id=="twait")
		RouterO.timeToWait=val;
	}



public void SetPropertyValue(string id, string val)
	{
	if (id=="state_rs") 
		RouterO.OnLightsRouterSign(val);  
	else if(id=="private-name")
		{
		privateName = val;
		ShowName(true);
		}
	}
};