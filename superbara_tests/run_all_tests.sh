#!/bin/bash

cd $(dirname "$0")
SUPERBARA_TAGS=smoke SUPERBARA_ON_ERROR=continue superbara run .