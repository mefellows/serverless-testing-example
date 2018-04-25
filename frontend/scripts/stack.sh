#!/bin/bash

# Shared config + functions
. $(dirname $0)/lib/utils

step "Running 'AWS stack create/update'"
stack_name="${APPLICATION_NAME}"
bucket_name="${APPLICATION_NAME}"
stack_template=file://scripts/stack.yaml
log "Detecting if stack exists"
stack_exists $stack_name
exists=$?

if [ ${exists} -eq 0 ]; then
    timestamp=$(date +%s)
    changesetname="${stack_name}-${timestamp}"

    log "Creating changeset"
    aws cloudformation create-change-set --change-set-name "${changesetname}" --stack-name "${stack_name}" --template-body "${stack_template}"

    log "Waiting for changeset"
    aws cloudformation wait change-set-create-complete --change-set-name "${changesetname}" --stack-name "${stack_name}"
    changeset=$(aws cloudformation describe-change-set --change-set-name "${changesetname}" --stack-name "${stack_name}" --output text --query 'ExecutionStatus')

    if [ "$changeset" == "AVAILABLE" ]; then
        aws cloudformation execute-change-set --change-set-name "${changesetname}" --stack-name "${stack_name}"

        # note: it's possible that this will never evaluate to true, if a rollback occurs, and the status is UPDATE_ROLLBACK_COMPLETE
        aws cloudformation wait stack-update-complete --stack-name "${stack_name}"
    else
        log "no changes to be executed, skipping"
    fi
else
  log "Creating stack"
  aws cloudformation create-stack \
    --stack-name ${stack_name} \
    --template-body "${stack_template}"

  log "Waiting for stack to complete"
  aws cloudformation wait stack-create-complete --stack-name ${stack_name}
fi

log "Done!"