---
layout: post
title:  "A Serie A Analysis"
categories: data
tags: data_viz data_collection data_analysis football_data
---
# Intro
I love football, or in Italian _calcio_. I follow football games pretty often and I also enjoy talking and writing about it in forums and chats. 
As a _calcio_ fan and Data Scientist I always looked around to find ways the increasing amount of data collected is used to analyse football matches in a more scientific way than it is currently done in most newspapers and TV commentary. 
Apart form a beautiful [book][the-numbers-game] from Sally and Anderson I could not find anything particularly interesting in published results. The most interesting analysis I read where taken from varoious independent analyst, usually blogging or sharing their analysis on social media.

In my opinion there is pleanty of room to give an original contribution to football analysis out there and I would liek to demonstrate how some kind of framework can eb quickly set up given a free dataset and a couple of python libraries.

# The Data
The most reliable and complete source of data I found is [here][football-data]. In this website you can find a number of statistics (in csv format) for many leagues across Europe. I started by downloading the files for the last couple of season.   

The usual imports and we are ready to read the file.
{% highlight python %}
import pandas as pd 
df_cal = pd.read_csv("serieA_1516.csv")
{% endhighlight %}

Here we opened only the serie A 2015/2016 file and in the dataframe there are all match infos for the season, results, shots on target, corners...
To have a detailed list of the info in the csv files you can look [here][football-data-notes].

The first step of the analysis is to extract the name of the teams in the League, but of course you also can hard-code it as a list.
  
{% highlight python %}
teams_a = [] 

for i,cal in enumerate(df_cal.iterrows()):
    teams_a.append(cal[1]["HomeTeam"])
    teams_a.append(cal[1]["AwayTeam"])
	#read only the first 10 matches
    if i == 9: break
        
print teams_a 
{% endhighlight %}

As the rows in the dataframe represent a match, it's sufficient to read the first 10 rows to get the names of all teams in serie A (20 teams).
We loop on the rows of the dataframe, extract the Home and Away team and append them to our team list.   

From here we can start showing all different types of correlations between, for example, the points scored by a team and the number of shots on target. 
To extract the number of shots made we can do the following:
  
{% highlight python %}
    for team in teams:
        team_home = df[df['HomeTeam']==team]
        team_away = df[df['AwayTeam']==team]
        #shots made
        team_s    = team_away["AS"].sum()  + team_home["HS"].sum()
{% endhighlight %}

Here, we read the dataframe *df* and extract the rows where the name of the home or away team is the correct one. We save these as two separate dataframes (one for the matches where the team played away, the other for the matches where the team played home). 
We then read the column "AS" (away shots) in the case of away matches and the column "HS" in the case of home matches. Sum all values and we found out the number of shots of that team in the season. 
If we repeat this step for all teams we can build a simple dataframe that looks like this table:

|   | Team	   | Shots |
| 0	| Inter	   | 120   |
| 1	| Juventus | 150   |
| 2	| Milan	   | 130   | 
| 3	| Napoli   | 160   |

It is interesitng to add to this table a cloumn showing the number of points made by each of these teams in the season and see if there is a correlation between the number of points and the shots made. 
It is very simple to do and here is the snippet of code I used to do this:
{% highlight python %}
for team in teams:
        t      = df[(df['HomeTeam']==team) | (df['AwayTeam']==team)]
        team_home = df[df['HomeTeam']==team]
        team_away = df[df['AwayTeam']==team]
        team_h_win = len(team_home[team_home['FTHG']>team_home['FTAG']])
        team_a_win = len(team_away[team_away['FTAG']>team_away['FTHG']])
        team_draw = len(t[t['FTAG']==t['FTHG']])
        team_points = 3*team_a_win + 3*team_h_win + team_draw
{% endhighlight %}

The idea here is similar as before. Extract the rows with the team playing away or home, count the number of wins of the team by selecting the rows where the home team scores more goals then the away team and viceversa. Do not forget to account for draws. Finally sum the number of draws with the number of won matches multiplied by three. 
So we can have a table like this now:

|   | Team	   | Shots | Points |
| 0	| Inter	   | 120   | 60     |
| 1	| Juventus | 150   | 80     |
| 2	| Milan	   | 130   | 70     |
| 3	| Napoli   | 160   | 75     |

It turns out that there is quite a correlation between the number of points and the number of shots, at least for serie A 2015/2016 season. 

  

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


[the-numbers-game]: http://www.goodreads.com/book/show/17465493-the-numbers-game
[football-data]: http://www.football-data.co.uk/data.php
[football-data-notes]: http://www.football-data.co.uk/notes.txt