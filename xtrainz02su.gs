include "gs.gs"
include "xtrainz02a.gs"

class BinarySortedArraySu
	{
	public BinarySortedElementS[] DBSE=new BinarySortedElementS[0];	// основной массив элементов

	public int N=0;			// число инициализированных элементов



	public void UdgradeArraySize(int NewN )			// мастер предварительного выделения места массиву
		{
		int i;
		int old_size = DBSE.size();

		BinarySortedElementS[] DBSE2= new BinarySortedElementS[NewN];

		for(i=0;i<old_size;i++)			// пересохраняем старый массив
			DBSE2[i]=DBSE[i];



		for(i=old_size;i<NewN;i++)
			DBSE2[i]=new BinarySortedElementS();
				
		DBSE=DBSE2; 
		}







	bool Comp_str_FL(string a,string b)
		{
		if(a.size()>b.size())
			return false;
		if(a.size()<b.size())
			return true;

		int i=0;

		while(i<a.size())
			{
			if(a[i]>b[i])
				return false;
			if(a[i]<b[i])
				return true;
			++i;
			}


		return false;
		}


	public int Find(string a, bool mode) // при mode = true указывает место, где мог бы находиться новый элемент 
		{
		int i=0,f=0,b=N-1;
		if(N>0)
			{
			if(DBSE[f].a == a)
				return f;
			if(DBSE[b].a == a)
				return b;

			if(Comp_str_FL(a,DBSE[f].a))
				{
				if(mode)
					return 0;
				else
					return -1;
				}
			if(Comp_str_FL(DBSE[b].a,a))
				{
				if(mode)
					return N;
				else
					return -1;
				}
			
			while(b>(f+1))
				{
				i=f + (int)((b-f)/2);				// середина отрезка

				if(DBSE[i].a==a)
					return i;

				if( Comp_str_FL(DBSE[f].a,a) and Comp_str_FL(a,DBSE[i].a))	// на отрезке от f до i
					b=i;
				if( Comp_str_FL(DBSE[i].a,a) and Comp_str_FL(a,DBSE[b].a))	// на отрезке от i до b
					f=i;
				}

			if(DBSE[f+1].a==a or (mode and Comp_str_FL(DBSE[f].a,a) and Comp_str_FL(a,DBSE[f+1].a)))
				return f+1;

			if(mode and Comp_str_FL(DBSE[f+1].a,a) and Comp_str_FL(a,DBSE[f+2].a))
				return f+2;
			}
		
		if(mode)
			return i;
		return -1;					// не найден
		}


	
	public bool AddElement(string Name, GSObject NObject)
		{		
		if(DBSE.size()>0)
			{
			int t = Find(Name,true);

			if(t>=0 and t<=N)
				{
				int i;
				for(i=N-1;i>=t;i--)
					{
					DBSE[i+1].a=DBSE[i].a;
					DBSE[i+1].Object=DBSE[i].Object;
					}
				DBSE[t].a=Name;
				DBSE[t].Object=NObject;
				N++;

				return true;
				}
			}	
		return false;		
		}

	public void DeleteElement(string a)
		{
		int t = Find(a,false);
		if(t>=0)
			{
			DBSE[t].a=null;
			DBSE[t].Object=null;



			int i;
			for(i=t;i<N-1;i++)
				{
				DBSE[i].a=DBSE[i+1].a;
				DBSE[i].Object=DBSE[i+1].Object;
				}
			N--;

			DBSE[N].a=null;
			DBSE[N].Object=null;
			}	
		}

	public void DeleteElementByNmb(int a)
		{
		
		if(a>=0)
			{
			DBSE[a].a=null;
			DBSE[a].Object=null;


			int i;
			for(i=a;i<N-1;i++)
				{
				DBSE[i].a=DBSE[i+1].a;
				DBSE[i].Object=DBSE[i+1].Object;
				}
			N--;

			DBSE[N].a=null;
			DBSE[N].Object=null;
			}	
		}



	};