FROM python:3.11.15

WORKDIR /inference

COPY ./requirements.txt .

RUN pip install -r requirements.txt

RUN pip install opencv-python-headless

COPY ./assets/ ./app.py  ./inference.py ./main.py ./

CMD [ "python", "main.py" ]


