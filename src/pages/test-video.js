import SimpleVideoTest from '../../components/admin/SimpleVideoTest';

export default function VideoTestPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Prueba de Video - Jitsi Meet</h1>
        <div className="bg-white rounded-lg shadow-lg" style={{ height: '600px' }}>
          <SimpleVideoTest roomName="test-room-123" />
        </div>
      </div>
    </div>
  );
}
