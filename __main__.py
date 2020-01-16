from pymodbus.client.sync import ModbusSerialClient
from time import time
import config
def main():
    # configure modbus
    client = ModbusSerialClient(method='rtu')
    client.port = config.DEVICE_NAME
    client.baudrate = 115200
    client.parity = 'N'
    client.stopbits = 1
    if not client.connect():
        # raise Exception("can't connect to modbus")
        pass

    # open file
    file = open(config.OUTPUT_FILE, 'a+')
    while True:
        start = time()
        file.write("hello there general kenobi have you heard the tragedy of darth plageus the wise i thought not i am all the jedi")
        delta = time() - start

        print(delta)

if __name__ == '__main__':
    main()