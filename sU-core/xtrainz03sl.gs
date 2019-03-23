include "gs.gs"
include "xtrainz03su.gs"

class BinarySortedArraySl isclass BinarySortedArraySu
	{

	bool Comp_str_FL(string a,string b)
		{
		if(a.size()>b.size())
			return false;
		if(a.size()<b.size())
			return true;

		int i=a.size()-1;

		while(i>=0)
			{
			if(a[i]>b[i])
				return false;
			if(a[i]<b[i])
				return true;
			--i;
			}


		return false;
		}

	};
