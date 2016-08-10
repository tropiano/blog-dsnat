---
layout: post
title:  "An Hattrick Map"
date:   2016-08-10 19:05:13
categories: data
tags: hattrick data_viz data_collection api
---
# Intro

[Hattrick][hattrick-web] is a once-very-popular online football game that is quite addictive. 
As recently the results of my team have not been amazing I started playing a bit with its API. 
I will write about how I build a library to:

1. Query the hattrick API
2. Save data about the first 4 leagues in Italy. 

# The API
The Hattrick API is well documented [here][chpp] and the only difficult thing is to be able to set up a OAuth authentication procedure, which was solved by using [this nice library][oauth2]. 
Once the authentication part was overcome by copying some snippets of code over and over until they worked I started to realise I needed a bit more than one call to get all the information I needed. As I kept defining function after function and my file kept getting bigger I decided eventually to put everything in one big file and call it [pyhattrick][pyhattrick-web]. 

At this point getiing the team data is as easy as doing:

{% highlight python %}
import pyhattrick as pht 
#get the series id 
seriesid = pht.get_series_id_from_name("Serie A")
#get the teams info
teams = pht.get_teams_from_series_id(seriesid)
#and do the same for II, III, IV series
{% endhighlight %}

All team infos are then saved in a pandas dataframe and collected so they look kinda like this:

| name	        | gF  | gA	| points	| region	| league |
| ------------- |:---:|:---:|:---------:|:---------:|:------:|
| Ciuc United	| 9	  | 16	| 4	        | Piemonte	| IV.63  |
| ...	        | ... | ...	| ...       | ...	    | ...    |
| Man United	| 2	  | 14	| 3	        | Piemonte	| IV.62  |

The next step involves some data manipulation in order to aggregate the data at the regional level. 

# Data aggregation
The team's name is not really interesting, we just want to get the number of teams that play in a certain region, per serie. 

In order to create the groups we just do:
{% highlight python %}
groups = teams.groupby(by=["region","serie"])
{% endhighlight %}

We then create the region list dinamically, so we don't need to write it by hand:
{% highlight python %}
for g in groups:
    if g[0][0] not in region_list:
        region_list.append(g[0][0])
{% endhighlight %}

Last, we loop on the regions and fill 4 lists with the number of teams playing in each region, per serie. 
For example, for serie A we do:
{% highlight python %}
for region in region_list:
    for g in groups:
        if g[0][0]==region and g[0][1]=="Serie A":
            a_list.append(len(g[1]))
            break
    else:
        a_list.append(0)
{% endhighlight %}

The last step is to create a dataframe from the created lists (region, serie A teams, II serie team and so on):
{% highlight python %}
data = pd.DataFrame({'region': region_list, 'a': a_list, 'ii': ii_list, 'iii': iii_list, 'iv': iv_list})
{% endhighlight %}

The result is the following dataframe:

|   | a	| ii | iii | iv | region     | total |
| 0	| 0	| 2	 | 6   | 9  | Abruzzo    | 17    |
| 1	| 0	| 0	 | 2   | 2  | Bari	     | 4     |
| 2	| 0	| 0	 | 1   | 5  | Basilicata | 6     |
| 3	| 0	| 1	 | 1   | 6  | Bologna	 | 8     |
| ...	| ...	| ...	 | ...   | ...  | ...	 | ...     |

We save the dataframe into a csv file. 

# Data Visualisation

Once we have the csv file the only thing left is to link it to a map and show the data as as points or regions in the map. 

For example we can show a map of Italy and color the regions with different shades, with darker shades corresponding to regions with more teams. 

<iframe src="{{site.baseurl}}/js/italy-ht/italy-ht.html" marginwidth="0" marginheight="0" scrolling="no" width="750" height="800" frameBorder="0"></iframe>

Hovering over the regions you get an overview of how the teams in the selected region are distributed by serie. 


[jekyll]:      http://jekyllrb.com
[jekyll-gh]:   https://github.com/jekyll/jekyll
[jekyll-help]: https://github.com/jekyll/jekyll-help
[hattrick-web]: http://www.hattrick.org
[oauth2]: https://github.com/joestump/python-oauth2
[pyhattrick-web]: http://tropiano.github.io/pyhattrick/
[d3_map_tutorial]: http://chimera.labs.oreilly.com/books/1230000000345/ch12.html
[italy_geojson]: https://raw.githubusercontent.com/stefanocudini/leaflet-geojson-selector/master/examples/italy-regions.json