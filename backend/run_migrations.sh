#!/bin/bash
echo "Running Database Migrations..."
alembic upgrade head
