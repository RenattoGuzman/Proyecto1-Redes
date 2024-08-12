import xmpp
import time

# Datos de los usuarios y mensaje
USERNAME  = "guztest@alumchat.lol"
PASSWORD  = "*********"
TO  = "tatto404@alumchat.lol"
MESSAGE = "Hola, ¿cómo estás?"

def send_message(username, password, to, message):
    jid = xmpp.JID(username)
    client = xmpp.Client(jid.getDomain(), debug=[])
    
    if not client.connect():
        print("No se pudo conectar al servidor.")
        return False

    if not client.auth(jid.getNode(), password):
        print("Autenticación fallida.")
        return False

    client.sendInitPresence()
    
    message = xmpp.Message(to, message)
    message.setAttr('type', 'chat')
    
    client.send(message)
    print(f"Mensaje enviado a {to}")
    
    # Esperar un momento antes de desconectar
    time.sleep(1)
    
    client.disconnect()
    return True

if __name__ == "__main__":
    success = send_message(USERNAME, PASSWORD, TO, MESSAGE)
    if success:
        print("Mensaje enviado exitosamente.")
    else:
        print("No se pudo enviar el mensaje.")