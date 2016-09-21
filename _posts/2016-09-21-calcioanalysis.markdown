---
layout: post
title:  "A Serie A Analysis"
categories: data
tags: data_viz data_collection data_analysis football_data
---
# Intro
I love football, or in Italian _calcio_. I follow football games pretty often and I also enjoy talking and writing about it in forums and chats. 
As a _calcio_ fan and Data Scientist I always looked around to find ways the increasing amount of data collected is used to analyse football matches in a more scientific way than it is currently done in most newspapers and TV commentary. 
Apart form a beautiful [book][the-numbers-game] from Sally and Anderson I could not find anything particularly interesting in published results. The most interesting analysis I read where taken from independent analysts, usually blogging or sharing their work on social media.

In my opinion there is plenty of room to give an original contribution to football analysis out there and I would like to show how some kind of framework can be quickly set up given a free dataset and a couple of python libraries.

# The Data
The most reliable, complete and above all free source of data I found is [here][football-data]. In this website you can find a number of statistics (in csv format) for many leagues across Europe. One starts by downloading the files for the last couple of season.   

The usual imports and the file is ready to be read.
{% highlight python %}
import pandas as pd 
df_cal = pd.read_csv("serieA_1516.csv")
{% endhighlight %}

Here one opens only the serie A 2015/2016 file and in the dataframe there are all match infos for the season, results, shots on target, corners...
To have a detailed list of the info in the csv files you can look [here][football-data-notes].

The first step is to extract the name of the teams in the League, but of course one can also hard-code it as a list.
  
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
One then loops on the rows of the dataframe, extract the Home and Away team and append them to our team list.   

From here one can start showing all different types of correlations between, for example, the points scored by a team and the number of shots on target. 
To extract the number of shots made one does the following:
  
{% highlight python %}
    for team in teams:
        team_home = df[df['HomeTeam']==team]
        team_away = df[df['AwayTeam']==team]
        #shots made
        team_s    = team_away["AS"].sum()  + team_home["HS"].sum()
{% endhighlight %}

Here, one reads the dataframe *df* and extract the rows where the name of the home or away team is the team one is looking for. One saves these as two separate dataframes (one for the matches where the team played away, the other for the matches where the team played home). 
One then reads the column "AS" (away shots) in the case of away matches and the column "HS" in the case of home matches. Summing all values and one gets the number of shots made by that particular team in the season. 
If one repeats this step for all teams we can build a simple dataframe that looks like this table:

|   | Team	   | Shots |
| 0	| Inter	   | 120   |
| 1	| Juventus | 150   |
| 2	| Milan	   | 130   | 
| 3	| Napoli   | 160   |

<br/>
It is interesting to add to this table a cloumn showing the number of points made by each of these teams in the season and see if there is a correlation between the number of points and the shots made. 
It is very simple to do and here is the snippet of code to do this:
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
So one has a table like this now:

|   | Team	   | Shots | Points |
| 0	| Inter	   | 120   | 60     |
| 1	| Juventus | 150   | 80     |
| 2	| Milan	   | 130   | 70     |
| 3	| Napoli   | 160   | 75     |

<br/>
It turns out that there is quite a correlation between the number of points and the number of shots, at least for serie A 2015/2016 season. 
<iframe src="{{site.baseurl}}/js/serie-a/scatter.html" marginwidth="0" marginheight="0" scrolling="no" width="750" height="600" frameBorder="0"></iframe>

As one can see from the scatter plot above, Juventus was the team whith the highest points in the season and the second highest number of shots. The correlation seems not to hold in the low end of the point spectrum (the two teams with the lowest points shooted more than teams that staid up) hinting at other variables being important in predicting the number of points at the end of the season. 

# Model building

In order to build a model that can predict the number of points a team will make at the end of the season the first step is to extract as many predictive features as possible. 
Following the same procedure described above one can extract the followings:

1. Shots made.
2. Shots on target.
3. Shots conceded. 
4. Shots on target conceded. 
5. Corners.
6. Corners conceded. 

The second step will be to feed these features to some kind of regression model. One can use part of the dataset to train the model and part to test the accuracy of it and then draw some conclusion.

For this exercise one can use a simple linear regression model.  
{% highlight python %}
df = pd.DataFrame.from_csv("../data/serieA.csv")

features = df[["shots","shots_ontarget","shots_conceded","shots_conceded_ontarget","corners","corners_conceded"]]
target   = df["points"]
{% endhighlight %}

First step is to read the dataframe where all the features built for the model have been saved. 
Then one defines the _target_ and _feature_ vectors. The features vector has been discussed above, the target vector is made from the points of each team at the end of the season. 
In this case many serie A seasons have been analysed and aggregated together in order to increase the statistics and improve the model precision. 

Next step, create a Linear Regression Model and train it. 

{% highlight python %}
from sklearn import datasets, linear_model
regr = linear_model.LinearRegression(fit_intercept=False)
{% endhighlight %}

In order to train the model one can use cross validation, there is a library in [scikit-learn][scikit-link] for it, is very easy to use. 

{% highlight python %}
from sklearn import cross_validation as cv
scores = cv.cross_val_score(regr, features, target,cv=4)
print("Regression scores", scores)
print("Regression scores average %.2f" %np.mean(scores))
print("scores variance %.2f" %np.std(scores))
{% endhighlight %}
  
Here one simply uses a 4-fold **cross validation** to train the model 4 times on 4 different subsets of the original data sample. 
At the end of each training one evaluates the score of the model and saves it in a vector called score. In the case of **Linear regression** the score is a simple R^2. 
All of it is done in just one line using the cross validation library provided by scikit-learn. 
In this case R2=0.70±0.07 

# Further developments
The analysis above can be improved in a number of ways. From analysing a bigger dataset to adding more features to applying a different model, like a **regression tree** for example. 
The general approach wuold be the same. Split the data sample in N-folds, use one fold to test the model and train the model on the remaining (N-1) folds. Repeat for each fold and average the result to get an idea of how good is your model. 
For an excellent introduction to the technique I recommend [this video][nfold-cv]

[the-numbers-game]: http://www.goodreads.com/book/show/17465493-the-numbers-game
[football-data]: http://www.football-data.co.uk/data.php
[football-data-notes]: http://www.football-data.co.uk/notes.txt
[scikit-link]: http://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LinearRegression.html
[nfold-cv]: http://blog.kaggle.com/2015/06/29/scikit-learn-video-7-optimizing-your-model-with-cross-validation/