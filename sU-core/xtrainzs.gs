include "gs.gs"

class BinarySortedStrings
	{
	public string[] SE=new string[0];					// �������� ������ ���������

	public int N=0;								// ����� ������������������ ���������

	bool el_exists=false;							// ����� ������ FindPlace() ���������, ��� ������� ��� ��� ��������


	bool Comp_str_Fu(string a,string b)
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
			if(SE[f] == a)
				return f;
			if(SE[b] == a)
				return b;

			if(Comp_str_Fu(a,SE[f]))
				return -1;
			
			if(Comp_str_Fu(SE[b],a))
				return -1;
			
			while(b>(f+1))
				{
				i=f + (int)((b-f)/2);				// �������� �������

				if(SE[i]==a)
					return i;

				if( Comp_str_Fu(SE[f],a) and Comp_str_Fu(a,SE[i]))	// �� ������� �� f �� i
					b=i;
				if( Comp_str_Fu(SE[i],a) and Comp_str_Fu(a,SE[b]))	// �� ������� �� i �� b
					f=i;
				}

			if(SE[f+1]==a)
				return f+1;
			}
		return -1;					// �� ������
		}




	public int FindPlace(string a)			 // ��������� �����, ��� ��� �� ���������� ����� ������� 
		{
		int i=0,f=0,b=N-1;

		el_exists=false;

		if(N>0)
			{
			if(SE[f] == a)
				{
				el_exists = true;
				return f;
				}
			if(SE[b] == a)
				{
				el_exists = true;
				return b;
				}

			if(Comp_str_Fu(a,SE[f]))
				return 0;
				
			if(Comp_str_Fu(SE[b],a))
				return N;
			
			while(b>(f+1))
				{
				i=f + (int)((b-f)/2);				// �������� �������

				if(SE[i]==a)
					{
					el_exists = true;
					return i;
					}

				if( Comp_str_Fu(SE[f],a) and Comp_str_Fu(a,SE[i]))	// �� ������� �� f �� i
					b=i;
				if( Comp_str_Fu(SE[i],a) and Comp_str_Fu(a,SE[b]))	// �� ������� �� i �� b
					f=i;
				}

			if(SE[f+1]==a)
				{
				el_exists = true;
				return f+1;
				}

			if(Comp_str_Fu(SE[f],a) and Comp_str_Fu(a,SE[f+1]))
				return f+1;

			if(Comp_str_Fu(SE[f+1],a) and Comp_str_Fu(a,SE[f+2]))
				return f+2;
			}
		
		return i;
		}


	public int Find(string a, bool mode) // ��� mode = true ��������� �����, ��� ��� �� ���������� ����� ������� 
		{
		if(mode)
			return FindPlace(a);

		return Find(a);
		}


	
	public int AddElement(string Name)
		{
		int t = FindPlace(Name);

		if(t>=0 and t<=N)
			{
			if(!el_exists)
				{
				SE[t,t]=new string[1];
				SE[t]=Name+"";
				N++;
				}
			return t;
			}
	
		return -1;		
		}


	public void DeleteElementByNmb(int a)
		{
		if(a>=0)
			{
			SE[a]=null;
			SE[a,a+1]=null;
			N--;
			}	
		}


	public void DeleteElement(string a)
		{
		int t = Find(a,false);
		DeleteElementByNmb(t);	
		}



	};
