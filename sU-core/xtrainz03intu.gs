include "gs.gs"
include "xtrainz03a.gs"

class BinarySortedArrayIntu
	{
	public BinarySortedElementInt[] DBSE=new BinarySortedElementInt[0];	// основной массив элементов

	public int N=0;			// число инициализированных элементов

	bool el_exists=false;		// после вызова FindPlace() указывает, что элемент уже был добавлен




	bool Comp_int_FL(string a,string b)
		{
		if(a < b)
			return true;

		return false;
		}


	public int Find(int a)
		{
		int i=0,f=0,b=N-1;

		if(N>0)
			{
			if(a == DBSE[f].a)
				return f;
			if(DBSE[b].a == a)
				return b;

			if((a < DBSE[f].a) or (DBSE[b].a < a))
				return -1;
			
			while(b>(f+1))
				{
				i=f + (int)((b-f)/2);				// середина отрезка

				if(DBSE[i].a==a)
					return i;

				if( (DBSE[f].a < a) and (a < DBSE[i].a) )	// на отрезке от f до i
					b=i;
				if( (DBSE[i].a < a) and (a < DBSE[b].a) )	// на отрезке от i до b
					f=i;
				}

			if(DBSE[f+1].a==a)
				return f+1;
			}
		return -1;					// не найден
		}


	public int FindPlace(int a) // указывает место, где мог бы находиться новый элемент 
		{
		int i=0,f=0,b=N-1;

		el_exists=false;

		if(N>0)
			{
			if(a == DBSE[f].a)
				{
				el_exists = true;
				return f;
				}
			if(DBSE[b].a == a)
				{
				el_exists = true;
				return b;
				}

			if(a < DBSE[f].a)
				return 0;
				
			if(DBSE[b].a < a)
				return N;
			
			while(b>(f+1))
				{
				i=f + (int)((b-f)/2);				// середина отрезка

				if(DBSE[i].a==a)
					{
					el_exists = true;
					return i;
					}

				if( (DBSE[f].a < a) and (a < DBSE[i].a) )	// на отрезке от f до i
					b=i;
				if( (DBSE[i].a < a) and (a < DBSE[b].a) )	// на отрезке от i до b
					f=i;
				}

			if(DBSE[f+1].a==a)
				{
				el_exists = true;
				return f+1;
				}

			if((DBSE[f].a < a) and (a < DBSE[f+1].a))
				return f+1;

			if((DBSE[f+1].a < a) and (a < DBSE[f+2].a))
				return f+2;
			}
		
		return i;
		}



	public int Find(int a, bool mode) // при mode = true указывает место, где мог бы находиться новый элемент 
		{
		if(mode)
			return FindPlace(a);

		return Find(a);
		}



	
	public int AddElement(int a, GSObject NObject)
		{		
		int t = FindPlace(a);
		if(t>=0 and t<=N)
			{
			if(!el_exists)
				{
				DBSE[t,t]=new BinarySortedElementInt[1];
				DBSE[t]=new BinarySortedElementInt();
				N++;
				DBSE[t].a=a;
				}
				
			DBSE[t].Object=NObject;
			return t;
			}	
		return -1;		
		}


	public void DeleteElementByNmb(int a)
		{
		if(a>=0)
			{
			DBSE[a].Object=null;
			DBSE[a]=null;
			DBSE[a,a+1]=null;
			N--;
			}	
		}

	public void DeleteElement(int a)
		{
		int t = Find(a,false);
		DeleteElementByNmb(t);	
		}



	};
