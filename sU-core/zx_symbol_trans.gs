


static class zxSymbolTranslator
{

/*

	22 47 48 50

CP1251	A  Ù  İ  ß

UTF-8	Ğ Ğ© Ğ­ Ğ¯

	Ğ° Ñ‰ Ñ Ñ

*/



public int GetCirillic(string s)
	{
	if(s>="Ğ" and s<="Ğ©")
		{
		return (22 + s[1] - '');
		}

	if(s>="Ğ­" and s<="Ğ¯")
		{
		return (48 + s[1] - '­');
		}

	if(s>="Ğ°" and s<="Ñ‰")
		{
		if(s[0]=='Ğ')
			return (22 + s[1] - '°');
		else
			{
			return (86 + s[1] - '°');
			}
		}

	if(s>="Ñ" and s<="Ñ")
		{
		return (48 + s[1] - '');
		}


	return -1;

	}

public int GetArabic(int i, string s)
	{
	if(s[i]>='0' and s[i]<='9')
		return (s[i] - '0');
	return -1;
	}

public void GetRome(int i, string s, int[] result)
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
};