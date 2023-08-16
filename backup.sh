#!/bin/bash

DATABASE="production" #replace with database name
HOSTNAME=""           #replace with database hostname
PORT=27017
USERNAME="" #replace with database username
PASSWORD="" #replace with database password

TIMESTAMP=$(date +%F-%H%M)
S3_BUCKET_NAME="database-backups-archive"
S3_BUCKET_PATH="$DATABASE"
DEST="/home/ubuntu/dump"
TAR=$DEST/$DATABASE-$TIMESTAMP

#Force file syncronization and lock writes
mongosh --host $HOSTNAME --port $PORT -u $USERNAME -p $PASSWORD --authenticationDatabase admin --eval "use $DATABASE" --eval "db.fsyncLock();"
echo "Database Locked 🔒"

# Create backup
echo "Backing up $HOSTNAME/$DATABASE"
/usr/bin/mongodump --host $HOSTNAME --port $PORT -u $USERNAME -p $PASSWORD --authenticationDatabase admin -d $DATABASE -o $DEST --gzip

# Add timestamp to backup
/bin/tar cf $TAR -C $DEST .

# Upload to S3
aws s3 cp $TAR s3://$S3_BUCKET_NAME/$S3_BUCKET_PATH/$DATABASE-$TIMESTAMP

#Unlock database writes
mongosh --host $HOSTNAME --port $PORT -u $USERNAME -p $PASSWORD --authenticationDatabase admin --eval="use $DATABASE" --eval="db.fsyncUnlock();"
echo "Database Unlocked 🔐"

#Delete local files
rm -rf $TAR
rm -rf $DEST

echo "Backup Complete ✅"

# for db in $DBS; do
#     col=$(mongo $db --host example.com --quiet --eval "db.getCollectionNames()" | tr -d ',"[]')
#     for collection in $col; do
#         $MONGODUMP_PATH -h $HOSTNAME:$PORT -q '{_id: {$gt: 10}}' -d $db -c $collection --out dump

#     done
# done
