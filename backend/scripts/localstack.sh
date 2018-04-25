#!/bin/bash


aws --endpoint-url=http://localhost:4569 dynamodb create-table \
  --table-name checkpoint  \
  --attribute-definitions AttributeName=Type,AttributeType=S \
  --key-schema AttributeName=Type,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

aws --endpoint-url=http://localhost:4569 dynamodb put-item --table-name checkpoint  --item '{"Type":{"S":"twitter"},"LastItem":{"N":"0"}}'
