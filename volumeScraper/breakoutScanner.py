import os
import time
import multiprocessing
from joblib import Parallel, delayed, parallel_backend
from functools import partial
from multiprocessing.pool import Pool
import json
from stocklist import NasdaqController
import requests
from dotenv import load_dotenv
load_dotenv()

avAPIKey = os.getenv('alphaVantageAPIKey')

class mainObj:

    tickersWithPotential = []

    def __init__(self):
        pass

    def getTickerInfo(self,ticker,functionName):
        companyOverview = requests.get("https://www.alphavantage.co/query?function=" + functionName + "&symbol=" + ticker + "&apikey=" + avAPIKey)
        return companyOverview.json()

    def compareATHToHOD(self,ticker):
        print(ticker)
        yearHigh = self.getTickerInfo(ticker,"OVERVIEW")["52WeekHigh"]
        dayHigh = self.getTickerInfo(ticker,"GLOBAL_QUOTE")["Global Quote"]["03. high"]
        if dayHigh >= yearHigh:
            self.tickersWithPotential.append(ticker)
            print("Ticker Name: " + ticker + ' Day High: ' + str(dayHigh) + ' year high ' + str(yearHigh))

    def main_func(self):
        StocksController = NasdaqController()
        list_of_tickers = StocksController.getListedOnly()

        with Pool(multiprocessing.cpu_count()) as p:
            p.map(self.compareATHToHOD, list_of_tickers)

        print(json.dumps(self.tickersWithPotential))

if __name__ == '__main__':
    mainObj().main_func()
