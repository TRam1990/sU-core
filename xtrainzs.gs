include "gs.gs"

class BinarySortedStrings
	{
	public string[] SE=new string[0];												// �������� ������ ���������

	public int N=0;																	// ����� ������������������ ���������


	public void UdgradeArraySize(int NewN )											// ������ ���������������� ��������� ����� �������
		{
		int i;
		string[] SE2= new string[NewN];

		for(i=0;i<N;i++)															// ������������� ������ ������
			{
			SE2[i]=SE[i];
			SE[i]=null;
			}

		SE[0,N]=null;

		SE=SE2;

		SE2=null;
		}

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

	public int Find(string a, bool mode)											 // ��� mode = true ��������� �����, ��� ��� �� ���������� ����� ������� 
		{
		int i=0,f=0,b=N-1;
		if(N>0)
			{
			if(SE[f] == a)
				return f;
			if(SE[b] == a)
				return b;

			if(Comp_str_Fu(a,SE[f]))
				{
				if(mode)
					return 0;
				else
					return -1;
				}
			if(Comp_str_Fu(SE[b],a))
				{
				if(mode)
					return N;
				else
					return -1;
				}
			
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

			if(SE[f+1]==a or (mode and Comp_str_Fu(SE[f],a) and Comp_str_Fu(a,SE[f+1])))
				return f+1;

			if(mode and Comp_str_Fu(SE[f+1],a) and Comp_str_Fu(a,SE[f+2]))
				return f+2;
			}
		
		if(mode)
			return i;
		return -1;					// �� ������
		}


	
	public bool AddElement(string Name)
		{
				
		if(SE.size()>0 and Find(Name,false)<0)
			{
			int t = Find(Name,true);

			if(t>=0 and t<=N)
				{
				string[] s_tmp= new string[1];
				s_tmp[0]=Name+"";
				SE[t,t]=s_tmp;
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
			SE[t,t+1]=null;
			N--;
			}	
		}

	public void DeleteElementByNmb(int a)
		{
		
		if(a>=0)
			{
			SE[a,a+1]=null;
			N--;
			}	
		}



	};