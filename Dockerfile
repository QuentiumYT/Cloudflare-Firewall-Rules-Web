################################################################################
# Stage 1: Generate styles & modules for the application
################################################################################

FROM node:16-alpine as build_app

ENV WORKDIR=/usr/src
RUN mkdir -p $WORKDIR

WORKDIR $WORKDIR
COPY . $WORKDIR

# Install dependencies
RUN npm install
# Build app
RUN npm run build

RUN cd static/ && npm install

RUN rm -rf $WORKDIR/.git/
RUN rm -rf $WORKDIR/node_modules/

################################################################################
# Stage 2: Run the Flask application
################################################################################

FROM python:3.10

# Install tools
RUN apt-get update && \
    apt-get install -y nano

# Add build app
COPY --from=build_app /usr/src/ /var/www/web/

# Python requirements
COPY requirements.txt /root/python/requirements.txt
RUN pip install --upgrade -r /root/python/requirements.txt

# Expose 80, 443 ports
EXPOSE 80 443
CMD ["/var/www/web/app.py"]
