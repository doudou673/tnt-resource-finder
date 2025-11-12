import { SearchInterface } from "@/components/search"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Page() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              时代少年团资源管理中心
            </h1>
            <p className="text-gray-600">
              搜索、管理和查看时代少年团的各类资源
            </p>
          </div>

          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">资源搜索</TabsTrigger>
              <TabsTrigger value="admin">管理面板</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="mt-6">
              <SearchInterface />
            </TabsContent>

            <TabsContent value="admin" className="mt-6">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">系统管理</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">数据统计</h3>
                    <p className="text-gray-600 mb-4">查看资源统计和使用情况</p>
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>总资源数</span>
                        <span className="font-medium">-</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>今日新增</span>
                        <span className="font-medium">-</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>活跃用户</span>
                        <span className="font-medium">-</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">数据管理</h3>
                    <p className="text-gray-600 mb-4">管理数据库内容和设置</p>
                    <div className="space-y-3">
                      <button className="w-full text-left p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                        <div className="font-medium">导出数据</div>
                        <div className="text-sm text-gray-600">下载所有资源数据</div>
                      </button>
                      <button className="w-full text-left p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                        <div className="font-medium">清理重复数据</div>
                        <div className="text-sm text-gray-600">移除重复的资源记录</div>
                      </button>
                      <button className="w-full text-left p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                        <div className="font-medium">手动抓取</div>
                        <div className="text-sm text-gray-600">触发在线资源抓取</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}