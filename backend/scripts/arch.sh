echo "digraph { ranksep=3; ratio=auto; overlap=false; node [  shape = plaintext, fontname = "Helvetica" ];" > latest.dot ; curl -v -u 'dXfltyFMgNOFZAxr8io9wJ37iUpY42M:O5AIZWxelWbLvqMd8PkAVycBJh2Psyg1' https://test.pact.dius.com.au/pacts/latest | jq '.pacts[]._embedded | select(.consumer.name | contains("AWSSummiteer")) | .consumer.name + "->" + .provider.name' | tr -d '"' |  sed 's/-/_/g' | sed 's/_>/->/g' >> latest.dot; echo "}" >> latest.dot
dot latest.dot -oarch.png -Tpng
open arch.png


