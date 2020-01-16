from pymodbus.client.sync import ModbusSerialClient as ModbusClient
from pymodbus.exceptions import ModbusIOException
from time import time_ns, time
import json
import config
from os import path

file = None
def main():
    global file
    # configure modbus
    client = ModbusClient(method='rtu', port=config.DEVICE_NAME, timeout=2)
    client.baudrate = 115200
    client.parity = 'N'
    client.stopbits = 1
    if not client.connect():
        raise Exception("can't connect to modbus")
    # open file
    file = open(config.OUTPUT_FILE, 'a')
    if path.getsize(config.OUTPUT_FILE) == 0:
        print(buildHeader(), file=file)

    # cache
    cache = buildCache()
    print(cache)
    lastNotify = time()
    while True:
        start = time_ns()

        regResp = client.read_input_registers(config.START_REGISTER,count=len(config.REGISTER_LABELS), unit=15)
        if isinstance(regResp, ModbusIOException):
            continue
        for reg in regResp.registers:
            file.write(str(reg)+',')

        if time() > lastNotify + config.NOTIFY_WORLD_FREQ:
            indicies = [0] * len(config.LABELS)
            for i,reg in enumerate(regResp.registers):
                labelIdx = config.REGISTER_LABELS[i]
                if labelIdx is 0:
                    continue
                labelIdx = labelIdx - 1
                label = config.LABELS[labelIdx]
                cache[label][indicies[labelIdx]] = reg
                indicies[labelIdx] = indicies[labelIdx] + 1
            print(cache)
            lastNotify = time()
        
        delta = time_ns() - start
        print(delta, file=file)

def buildCache():
    cache = {}
    for label in config.LABELS:
        cache[label] = []
    for token in config.REGISTER_LABELS:
        if token == 0:
            continue
        label = config.LABELS[token - 1]
        cache[label].append(0)
    return cache
def buildHeader():
    header = ""
    for token in config.REGISTER_LABELS:
        if token == 0:
            header = header+'0,'
            continue
        header = header + config.LABELS[token-1] + ','
    header = header + 'fps'
    return header

if __name__ == '__main__':
    try:
        main()
    except:
        file.close()