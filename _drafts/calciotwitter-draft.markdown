---
layout: post
title:  "Footbal Analytics on Twotter"
categories: data
tags: data_analysis football_data automation 
---
# Intro
In my previous post I showed how to create a model to predict the number of points of a football team starting from basic stats. 
I am going to show here how to use the model to create a meaningful visualisation and share it on Twitter. The footballm analytics community is very active on Twitter and I wanted to participate to get some feedback on the work I have done. The idea was to publich the predicted points resulting from my model against the actual points scored by the serie A teams weekly. Unfortunately I do not have much time to dedicate to twitter and I thought it would be less time consuming and more efficient to automate the whole process.
In this post I will explain how to write a script to:
1. Extract the data published weekly on serie A match results. 
2. Apply a pre-trained model to these data. 
3. Publish the result on Twitter.
4. Get the script to run following a schedule. 

# Data Extraction
The data extraction process is very simple. On [this website][football-data] there are all data needed to get the features and apply a previouslt reined model. One can look at the previous post to understand how one can build a model from scratch. 

Using pandas one can read the file directly from the website
{% highlight python %}
import pandas as pd 
df_week = pd.read_csv("http://www.football-data.co.uk/mmz4281/1617/I1.csv")
{% endhighlight %}

Here one opens only the latest serie file and in the dataframe there are all match infos for the season, results, shots on target, corners...
The next step is to calculate the features one uses in the model. This has been covered too in the previous post. These must be the same features used during model training. 

A step back now. When one builds a model in scikit-learn there is the option to store the trained model in a file and use it later on updated data. The process to do it is the following.

{% highlight python %}
from sklearn.externals import joblib
regr = linear_model.LinearRegression(fit_intercept=False)
regr.fit(features,target)
joblib.dump(regr, 'linreg_model.pkl')  
{% endhighlight %}

First of all one imports the joblib library, used to store the results of the training. The model is then created, fitted on some data and saved in a file. Just 4 lines of code. 

Once the model has been saved one can read it again doing:

{% highlight python %}
model = joblib.load('../linreg_model.pkl')	
{% endhighlight %}

The model can be readily applied to the new data doing:

{% highlight python %}
pred_1617 = model_1.predict(feat_1617)
{% endhighlight %}

Here the pred_1617 list contains the predicted points for the serie A teams updated at this week. 

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