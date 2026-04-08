import type { ChatConnection, ChatMessage } from '../../types';
import { addMessageIdToConnectionIndex } from './addMessageIdToConnectionIndex';
import { createConnection } from './createConnection';
import { createMessage } from './createMessage';
import { getConnectionById } from './getConnectionById';
import { getLastActivityAtForConnection } from './getLastActivityAtForConnection';
import { getMessagesByConnectionId } from './getMessagesByConnectionId';
import { listAcceptedConnections } from './listAcceptedConnections';
import { listConnectionsChangedForInitiator } from './listConnectionsChangedForInitiator';
import { listPendingConnectionsForRecipient } from './listPendingConnectionsForRecipient';
import { updateConnectionStatus } from './updateConnectionStatus';

export const chatStore = (
	connectionsById: Map<string, ChatConnection>,
	messagesById: Map<string, ChatMessage>,
	messageIdsByConnectionId: Map<string, string[]>
) => {
	const addMessageToConnectionIndex = addMessageIdToConnectionIndex(messageIdsByConnectionId);
	return {
		createConnection: createConnection(connectionsById),
		getConnectionById: getConnectionById(connectionsById),
		listPendingConnectionsForRecipient: listPendingConnectionsForRecipient(connectionsById),
		listConnectionsChangedForInitiator: listConnectionsChangedForInitiator(connectionsById),
		updateConnectionStatus: updateConnectionStatus(connectionsById),
		createMessage: createMessage(messagesById, addMessageToConnectionIndex),
		getMessagesByConnectionId: getMessagesByConnectionId(messagesById, messageIdsByConnectionId),
		listAcceptedConnections: listAcceptedConnections(connectionsById),
		getLastActivityAtForConnection: getLastActivityAtForConnection(
			connectionsById,
			messagesById,
			messageIdsByConnectionId
		)
	};
};
