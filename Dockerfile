FROM python:3.10

# Install tools
RUN apt-get update && \
    apt-get install -y nano

# Python requirements
COPY requirements.txt /root/python/requirements.txt
RUN pip install --upgrade -r /root/python/requirements.txt

# Expose 80, 443 ports
EXPOSE 80 443
CMD ["/var/www/web/app.py"]
