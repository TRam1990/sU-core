include "gs.gs"
include "xtrainz02a.gs"

class BinarySortedArrayIntu
	{
	public BinarySortedElementInt[] DBSE=new BinarySortedElementInt[0];	// основной массив элементов

	public int N=0;			// число инициализированных элементов



	public void UdgradeArraySize(int NewN )			// мастер предварительного выделения места массиву
		{
		int i;
		int old_size = DBSE.size();

		BinarySortedElementInt[] DBSE2= new BinarySortedElementInt[NewN];

		for(i=0;(i<old_size) and (i < NewN);i++)			// пересохраняем старый массив
			DBSE2[i]=DBSE[i];

		for(i=old_size;i<NewN;i++)
			DBSE2[i]=new BinarySortedElementInt();
		
		DBSE[0, ] = null;		
		
		DBSE=DBSE2; 
		}







	bool Comp_int_FL(string a,string b)
		{
		if(a < b)
			return true;

		return false;
		}


	public int Find(int a, bool mode) // при mode = true указывает место, где мог бы находиться новый элемент 
		{
		int i=0,f=0,b=N-1;
		if(N>0)
			{
			if(DBSE[f].a == a)
				return f;
			if(DBSE[b].a == a)
				return b;

			if(a < DBSE[f].a)
				{
				if(mode)
					return 0;
				else
					return -1;
				}
			if(DBSE[b].a < a)
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

				if( (DBSE[f].a < a) and (a < DBSE[i].a))	// на отрезке от f до i
					b=i;
				if( (DBSE[i].a < a) and (a < DBSE[b].a))	// на отрезке от i до b
					f=i;
				}

			if(DBSE[f+1].a==a or (mode and (DBSE[f].a < a) and (a < DBSE[f+1].a)))
				return f+1;

			if(mode and (DBSE[f+1].a < a) and (a < DBSE[f+2].a))
				return f+2;
			}
		
		if(mode)
			return i;
		return -1;					// не найден
		}


	
	public int AddElement(int a, GSObject NObject)
		{		
		if(DBSE.size()>0)
			{
			int t = Find(a,true);

			if(t>=0 and t<=N)
				{
				int i;
				for(i=N-1;i>=t;i--)
					{
					DBSE[i+1].a=DBSE[i].a;
					DBSE[i+1].Object=DBSE[i].Object;
					}
				DBSE[t].a=a;
				DBSE[t].Object=NObject;
				N++;

				return t;
				}
			}	
		return -1;		
		}


	public void DeleteElementByNmb(int a)
		{
		
		if(a>=0)
			{
			DBSE[a].Object=null;


			int i;
			for(i=a;i<N-1;i++)
				{
				DBSE[i].a=DBSE[i+1].a;
				DBSE[i].Object=DBSE[i+1].Object;
				}
			N--;

			DBSE[N].Object=null;
			}	
		}

	public void DeleteElement(int a)
		{
		int t = Find(a,false);
		DeleteElementByNmb(t);	
		}



	};