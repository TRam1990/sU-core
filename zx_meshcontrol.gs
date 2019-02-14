include "MeshObject.gs"


class zxMeshController isclass GSObject
{

public MeshObject[] LightMeshes;
public MeshObject[] KozMeshes;

public float dt_on = 0.2;
public float dt_off = 0.5;


public define string lens = "RGGYYYWWBL";	// красный зелёный жёлтый белый синий зелёная_полоса


public bool[] kozirki = new bool[10];



public void MakeMeshes(MeshObject parent, bool[] ex_lens, int[] positions , bool[] koz_mesh)
	{
	LightMeshes = new MeshObject[10];
	Asset main_asset = parent.GetAsset();
	int i;



	for(i = 0; i < 10; i++)
		{
		if(ex_lens[i])
			{
			Asset to_set = main_asset.FindAsset(lens[i,i+1] + "_light");
			LightMeshes[i] = parent.SetFXAttachment("c"+positions[i], to_set);
			}
		else
			{
			LightMeshes[i] = null;
			}

		kozirki[i]=false;
		}


	if(main_asset.GetStringTable().GetString("koz") == "1" )
		{
		KozMeshes = new MeshObject[10];


		if(koz_mesh)
			{
			for(i = 0; i < 10; i++)
				{
				if(ex_lens[i] and koz_mesh[i])
					{
					Asset to_set = main_asset.FindAsset(lens[i,i+1] + "_koz");
					KozMeshes[i] = parent.SetFXAttachment("k"+positions[i], to_set);
					if(KozMeshes[i])
						kozirki[i]=true;
					else
						kozirki[i]=false;


					}
				else
					{
					KozMeshes[i] = null;
					kozirki[i]=false;
					}
				}
			}
		else
			{
			for(i = 0; i < 10; i++)
				{
				if(ex_lens[i])
					{
					Asset to_set = main_asset.FindAsset(lens[i,i+1] + "_koz");
					KozMeshes[i] = parent.SetFXAttachment("k"+positions[i], to_set);
					if(KozMeshes[i])
						kozirki[i]=true;
					else
						kozirki[i]=false;


					}
				else
					{
					KozMeshes[i] = null;
					kozirki[i]=false;
					}
				}
			}
		}
	}

public void OffMeshes(bool[] set_lens)
	{
	int i;
	for(i=0;i<10;i++)
		if(LightMeshes[i] and !set_lens[i])
			{
			LightMeshes[i].SetMeshVisible("default",false,dt_off);
			if(kozirki[i])
				KozMeshes[i].SetMeshVisible("default",false,dt_off);
			}
	}

public void SetMeshes( bool[] set_lens)
	{
	int i;
	for(i=0;i<10;i++)
		if(LightMeshes[i] and set_lens[i])
			{
			LightMeshes[i].SetMeshVisible("default",set_lens[i],dt_on);
			if(kozirki[i])
				KozMeshes[i].SetMeshVisible("default",set_lens[i],dt_on);
			}
	}

public void RemoveMeshes(MeshObject parent,  int[] positions)
	{
	int i;
	for(i = 0; i < 10; i++)
		{
		if(LightMeshes[i])
			{
			LightMeshes[i] = parent.SetFXAttachment("c"+positions[i], null);

			if(kozirki[i])
				{
				kozirki[i]=false;

				KozMeshes[i] = parent.SetFXAttachment("k"+positions[i], null);
				}
			}
		}
	}


public void SetMesh( int num, bool state)
	{
	float dt=dt_off;
	if(state)
		dt=dt_on;

	if(LightMeshes[num])
		{
		LightMeshes[num].SetMeshVisible("default",state,dt);
		if(kozirki[num])
			KozMeshes[num].SetMeshVisible("default",state,dt);
		}
	}


};