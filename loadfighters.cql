WITH {json} as data
UNWIND data as q
MERGE (fighter:Fighter {twitter_id: q.id})
  ON MATCH SET 
    fighter.birthday = q.birthday,
  	fighter.nationality = q.nationality,
  	fighter.nickname = q.nickname,
  	fighter.height = q.height,
  	fighter.weight = q.weight,
  	fighter.weight_class = q.weight_class,
    fighter.name = toLower(q.name),
    fighter.screen_name = q.screen_name,
    fighter.description = q.description,
    fighter.favorites_count = q.favorites_count,
    fighter.statuses_count = q.statuses_count,
    fighter.followers_count = q.followers_count,
  	fighter.record = q.record
MERGE (g:Gym { name: q.association} )<-[:TRAINS_AT]-(fighter)
MERGE (g)-[:TRAINS]->(fighter)
FOREACH (fight IN q.fights |
	MERGE (o:Fighter {name: toLower(fight.opponent)})
	MERGE (fighter)-[fght:FOUGHT {date: fight.date, result: fight.result}]->(o)
	MERGE (f:Fight {name:fight.name, date: fight.date})
	MERGE (r:Referee {name:fight.referee})
	MERGE (fighter)<-[:REFEREED]-(r)-[:REFEREED]->(o)
	MERGE (r)-[:REFEREED]-(f)
	MERGE (fighter)-[comp:COMPETED_IN]->(f)<-[comp2:COMPETED_IN]-(o)
)
FOREACH (tweet IN q.tweet_data |
  MERGE (t:Tweet {id: tweet.id})
    ON MATCH SET 
      t.date = q.created_at,
      t.text = q.text,
      t.source = q.source,
      t.retweet_count = q.retweet_count
  MERGE (t)<-[:TWEETED]-(fighter)
)
return fighter.name