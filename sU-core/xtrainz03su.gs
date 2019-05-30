include "gs.gs"
include "xtrainz03a.gs"

include "interface.gs"

class BinarySortedArraySu
	{
	public BinarySortedElementS[] DBSE=new BinarySortedElementS[0];	// основной массив элементов

	public int N=0;			// число инициализированных элементов

	bool el_exists=false;		// после вызова FindPlace() указывает, что элемент уже был добавлен



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


	public int Find(string a)
		{
		int i=0,f=0,b=N-1;

		if(N>0)
			{
			if(a == DBSE[f].a)
				return f;
			if(DBSE[b].a == a)
				return b;

			if(Comp_str_FL(a,DBSE[f].a))
				return -1;

			if(Comp_str_FL(DBSE[b].a,a))
				return -1;
			
			while(b>(f+1))
				{
				i=f + (int)((b-f)/2);				// середина отрезка

				if(DBSE[i].a==a)
					return i;

				if( Comp_str_FL(a,DBSE[i].a))	// на отрезке от f до i
					b=i;
				else				// на отрезке от i до b
					f=i;
				}

			if(DBSE[f+1].a==a)
				return f+1;
			}
		return -1;					// не найден
		}



	public int FindPlace(string a) // указывает место, где мог бы находиться новый элемент 
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

			if(Comp_str_FL(a,DBSE[f].a))
				return 0;
				
			if(Comp_str_FL(DBSE[b].a,a))
				return N;
			
			while(b>(f+1))
				{
				i=f + (int)((b-f)/2);				// середина отрезка

				if(DBSE[i].a==a)
					{
					el_exists = true;
					return i;
					}

				if(Comp_str_FL(a,DBSE[i].a))	// на отрезке от f до i
					b=i;
				else				// на отрезке от i до b
					f=i;
				}

			if(DBSE[f+1].a==a)
				{
				el_exists = true;
				return f+1;
				}

			if(Comp_str_FL(DBSE[f].a,a) and Comp_str_FL(a,DBSE[f+1].a))
				return f+1;

			if(Comp_str_FL(DBSE[f+1].a,a) and Comp_str_FL(a,DBSE[f+2].a))
				return f+2;
			}
		
		return i;
		}


	public int Find(string a, bool mode) // при mode = true указывает место, где мог бы находиться новый элемент 
		{
		if(mode)
			return FindPlace(a);

		return Find(a);
		}


	
	public int AddElement(string Name, GSObject NObject)
		{
		int t = FindPlace(Name);

		if(t<=N and t>=0)
			{
			if(!el_exists)
				{
				DBSE[t,t]=new BinarySortedElementS[1];
				DBSE[t]=new BinarySortedElementS();
				N++;
				DBSE[t].a=Name;
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
			DBSE[a].a=null;
			DBSE[a].Object=null;
			DBSE[a]=null;
			DBSE[a,a+1]=null;
			N--;
			}	
		}

	public void DeleteElement(string a)
		{
		int t = Find(a,false);
		DeleteElementByNmb(t);
		}



	};
