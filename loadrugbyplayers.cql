WITH {json} as data
UNWIND data as q
MERGE (p:Player {name: toLower(trim(q.name))})
  ON MATCH SET 
    p.debut = q.debut,
  	p.position = trim(q.position),
  	p.nickname = q.nickname,
  	p.height = q.height,
  	p.weight = q.weight,
  	p.weight_class = q.weight_class,
  	p.record = q.record
MERGE (g:Gym { name: q.association} )<-[:TRAINS_AT]-(fighter)
FOREACH (fight IN q.fights |
	MERGE (o:Fighter {name: toLower(fight.opponent)})
	MERGE (fighter)-[fght:FOUGHT {date: fight.date, result: fight.result}]->(o)
	MERGE (f:Fight {name:fight.name, date: fight.date})
	MERGE (r:Referee {name:fight.referee})
	MERGE (fighter)<-[:REFEREED]-(r)-[:REFEREED]->(o)
	MERGE (r)-[:REFEREED]-(f)
	MERGE (fighter)-[comp:COMPETED_IN]->(f)<-[comp2:COMPETED_IN]-(o)
)
return fighter.name

Nodes:
PLAYER – represents a rugby player
GAME – represent a game
TEAM – represent a team (country)
POSITION – represent a country (country name, country code)

Relationships:
PLAYED relationship – in Player ad game
PLAYED_AGAINST relationship – player to player on opposing teams same game
PLAYED_WITH relationship – in player to player on the same team same game
PLAYED_FOR relationship – player and team
