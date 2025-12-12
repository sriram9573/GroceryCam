#!/bin/bash
# Setup script

cp .env.example .env
echo "Created .env from .env.example"

if ! command -v npm &> /dev/null
then
    echo "npm could not be found"
    exit
fi

echo "Installing dependencies..."
npm install

echo "Setup complete! Fill in your .env variables and run 'npm run dev'."
